<?php

use App\Exceptions\InsufficientStockException;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\SalesOrder;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\CostingService;
use App\Services\InventoryService;
use App\Services\RestockService;

if (! function_exists('restockParam')) {
    /**
     * @return array<string, mixed>
     */
    function restockParam(int $id, string $name, string $stock, string $daily, int $lead, int $size, int $price, string $abc, int $moq = 1): array
    {
        $service = new RestockService;
        $urgency = $service->urgency($stock, $daily, $lead);

        return array_merge([
            'ingredient_id' => $id,
            'name' => $name,
            'is_urgent' => bccomp($urgency, '1', 4) >= 0,
            'priority_score' => $service->priorityScore($urgency, $abc),
            'package_price' => $price,
            'revenue_impact' => '0',
            'moq_packages' => $moq,
        ], $service->packageQuantities($stock, $daily, $lead, 2, (string) $size, $moq));
    }
}

beforeEach(function () {
    $this->costing = new CostingService;
    $this->inventory = new InventoryService($this->costing);
    $this->restock = new RestockService;
    $this->user = User::factory()->create(['role' => 'owner']);

    $this->biji = Ingredient::create([
        'name' => 'Biji Kopi Arabika', 'base_unit' => 'gram', 'current_stock' => 1400,
        'minimum_stock' => 500, 'cost_per_unit' => 250, 'last_quote_price' => 300,
        'lead_time_days' => 2, 'package_size' => 500, 'package_price' => 125000,
    ]);
    $this->susu = Ingredient::create([
        'name' => 'Susu UHT', 'base_unit' => 'ml', 'current_stock' => 6000,
        'minimum_stock' => 2000, 'cost_per_unit' => 18, 'lead_time_days' => 1,
        'package_size' => 1000, 'package_price' => 18000,
    ]);
    $this->gula = Ingredient::create([
        'name' => 'Gula Aren Cair', 'base_unit' => 'ml', 'current_stock' => 2000,
        'minimum_stock' => 500, 'cost_per_unit' => 40, 'lead_time_days' => 2,
        'package_size' => 1000, 'package_price' => 40000,
    ]);
    $this->es = Ingredient::create([
        'name' => 'Es Batu', 'base_unit' => 'gram', 'current_stock' => 10000,
        'minimum_stock' => 3000, 'cost_per_unit' => 2, 'lead_time_days' => 1,
        'package_size' => 5000, 'package_price' => 10000,
    ]);
    $this->cup = Ingredient::create([
        'name' => 'Cup + Lid', 'base_unit' => 'pcs', 'current_stock' => 95,
        'minimum_stock' => 100, 'cost_per_unit' => 500, 'lead_time_days' => 3,
        'package_size' => 50, 'package_price' => 25000,
    ]);

    $this->menu = Menu::create([
        'name' => 'Es Kopi Susu Aren', 'category' => 'Kopi',
        'selling_price' => 22000, 'overhead' => 1500, 'is_active' => true,
    ]);
    $recipe = Recipe::create(['menu_id' => $this->menu->id, 'yield_portions' => 1]);

    $bom = [
        [$this->biji, 20, 0.05],
        [$this->susu, 150, 0.02],
        [$this->gula, 25, 0.04],
        [$this->es, 100, 0],
        [$this->cup, 1, 0],
    ];
    foreach ($bom as [$ingredient, $qty, $waste]) {
        RecipeIngredient::create([
            'recipe_id' => $recipe->id,
            'ingredient_id' => $ingredient->id,
            'quantity_needed' => $qty,
            'waste_factor' => $waste,
        ]);
    }

    $this->costing->recalculateMenu($this->menu->fresh());
});

it('menghitung WAC sesuai contoh kanonik BL 6.2', function () {
    $bahan = Ingredient::create([
        'name' => 'Bahan WAC', 'base_unit' => 'gram', 'current_stock' => 400,
        'minimum_stock' => 0, 'cost_per_unit' => 250,
        'package_size' => 500, 'package_price' => 125000,
    ]);

    $this->inventory->stockIn($bahan, '1000', '300');

    $bahan->refresh();
    expect((string) $bahan->current_stock)->toBe('1400.000')
        ->and((string) $bahan->cost_per_unit)->toBe('285.7143');
});

it('menghitung HPP aktual & proyeksi Es Kopi Susu Aren (BL 6.3-6.4)', function () {
    $menu = $this->menu->fresh();

    expect($this->costing->menuHpp($menu))->toBe('11244.00')
        ->and($this->costing->marginPct($menu))->toBe('48.89')
        ->and($menu->status)->toBe('profitable')
        ->and($this->costing->menuHpp($menu, true))->toBe('12294.00')
        ->and($this->costing->marginPct($menu, true))->toBe('44.12')
        ->and($menu->projected_status)->toBe('watchlist');
});

it('memotong stok sesuai BOM saat pesanan disimpan (BL 4.4)', function () {
    $order = $this->inventory->processOrder(
        [['menu_id' => $this->menu->id, 'quantity' => 10]],
        'cash',
        null,
        $this->user,
    );

    expect($order->total_amount)->toBe(220000);

    $this->biji->refresh();
    $this->cup->refresh();
    expect((string) $this->biji->current_stock)->toBe('1190.000')
        ->and((string) $this->cup->current_stock)->toBe('85.000');

    $movement = StockMovement::where('sales_order_id', $order->id)
        ->where('ingredient_id', $this->biji->id)
        ->first();
    expect((string) $movement->qty_change)->toBe('-210.000');
});

it('menolak seluruh pesanan saat stok kurang (FR-015)', function () {
    $this->cup->forceFill(['current_stock' => 5])->save();

    expect(fn () => $this->inventory->processOrder(
        [['menu_id' => $this->menu->id, 'quantity' => 10]],
        'cash',
        null,
        $this->user,
    ))->toThrow(InsufficientStockException::class);

    expect(SalesOrder::count())->toBe(0)
        ->and((string) $this->biji->fresh()->current_stock)->toBe('1400.000')
        ->and((string) $this->cup->fresh()->current_stock)->toBe('5.000');
});

it('tidak memotong stok dua kali untuk idempotency key sama (FR-016)', function () {
    $key = 'idem-key-abc';

    $first = $this->inventory->processOrder([['menu_id' => $this->menu->id, 'quantity' => 2]], 'cash', $key, $this->user);
    $second = $this->inventory->processOrder([['menu_id' => $this->menu->id, 'quantity' => 2]], 'cash', $key, $this->user);

    expect($first->id)->toBe($second->id)
        ->and(SalesOrder::count())->toBe(1);

    $this->biji->refresh();
    expect((string) $this->biji->current_stock)->toBe('1358.000'); // 1400 - 2*21
});

it('menyusun rencana restock kanonik kas 500rb -> total 483rb, sisa 17rb (BL 8.7)', function () {
    $make = function (int $id, string $stock, string $daily, int $lead, int $size, int $price, string $abc): array {
        $urgency = $this->restock->urgency($stock, $daily, $lead);

        return array_merge([
            'ingredient_id' => $id,
            'is_urgent' => bccomp($urgency, '1', 4) >= 0,
            'priority_score' => $this->restock->priorityScore($urgency, $abc),
            'package_price' => $price,
        ], $this->restock->packageQuantities($stock, $daily, $lead, 2, (string) $size, 1));
    };

    $params = [
        $make(1, '80', '100', 3, 50, 25000, 'A'),     // Cup + Lid
        $make(2, '300', '400', 2, 500, 150000, 'A'),  // Biji kopi
        $make(3, '2000', '3000', 1, 1000, 18000, 'A'), // Susu UHT
        $make(4, '1500', '500', 2, 1000, 40000, 'B'), // Gula aren
        $make(5, '200', '50', 3, 750, 95000, 'C'),    // Sirup hazelnut
    ];

    $plan = $this->restock->planRestock('500000', $params);

    expect($plan['total_cost'])->toBe(483000)
        ->and($plan['remaining_cash'])->toBe(17000);

    $labels = collect($plan['items'])->mapWithKeys(fn ($i) => [$i['ingredient_id'] => [$i['recommended_packages'], $i['label']]]);

    expect($labels[1])->toBe([9, 'beli_sekarang'])
        ->and($labels[2])->toBe([1, 'beli_sekarang_parsial'])
        ->and($labels[3])->toBe([6, 'beli_sekarang_parsial'])
        ->and($labels[4])->toBe([0, 'tahan_dulu'])
        ->and($labels[5])->toBe([0, 'tahan_dulu']);
});

it('mengklasifikasikan ABC dari kontribusi kumulatif (BL 8.3)', function () {
    $abc = $this->restock->abcClasses([1 => 600, 2 => 300, 3 => 100]);

    expect($abc[1])->toBe('A')
        ->and($abc[2])->toBe('B')
        ->and($abc[3])->toBe('C');
});

it('menandai "kas tidak cukup" saat Qmin tidak terjangkau (BL 8.6 fase 1)', function () {
    $params = [
        restockParam(1, 'Cup + Lid', '80', '100', 3, 50, 25000, 'A'),
        restockParam(2, 'Biji Kopi', '300', '400', 2, 500, 150000, 'A'),
        restockParam(3, 'Susu UHT', '2000', '3000', 1, 1000, 18000, 'A'),
        restockParam(4, 'Gula Aren', '1500', '500', 2, 1000, 40000, 'B'),
        restockParam(5, 'Sirup Hazelnut', '200', '50', 3, 750, 95000, 'C'),
    ];

    $plan = $this->restock->planRestock('100000', $params);
    $labels = collect($plan['items'])->mapWithKeys(fn ($i) => [$i['ingredient_id'] => [$i['recommended_packages'], $i['label']]]);

    expect($labels[1])->toBe([0, 'kas_tidak_cukup'])
        ->and($labels[2])->toBe([0, 'kas_tidak_cukup'])
        ->and($labels[3])->toBe([5, 'beli_sekarang_parsial'])
        ->and($plan['total_cost'])->toBe(90000)
        ->and($plan['remaining_cash'])->toBe(10000);
});

it('membeli bahan non-urgen sebagai opsional bila kas cukup (BL 8.6 fase 3)', function () {
    $params = [
        restockParam(1, 'Cup + Lid', '80', '100', 3, 50, 25000, 'A'),
        restockParam(2, 'Biji Kopi', '300', '400', 2, 500, 150000, 'A'),
        restockParam(3, 'Susu UHT', '2000', '3000', 1, 1000, 18000, 'A'),
        restockParam(4, 'Gula Aren', '1500', '500', 2, 1000, 40000, 'B'),
        restockParam(5, 'Sirup Hazelnut', '200', '50', 3, 750, 95000, 'C'),
    ];

    $plan = $this->restock->planRestock('1000000', $params);
    $labels = collect($plan['items'])->mapWithKeys(fn ($i) => [$i['ingredient_id'] => [$i['recommended_packages'], $i['label']]]);

    expect($labels[4])->toBe([1, 'beli_opsional'])
        ->and($labels[5])->toBe([1, 'beli_opsional'])
        ->and($plan['total_cost'])->toBe(936000)
        ->and($plan['remaining_cash'])->toBe(64000);
});
