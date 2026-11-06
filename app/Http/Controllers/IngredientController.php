<?php

namespace App\Http\Controllers;

use App\Http\Requests\Ingredient\AdjustIngredientStockRequest;
use App\Http\Requests\Ingredient\StockInIngredientRequest;
use App\Http\Requests\Ingredient\StoreIngredientRequest;
use App\Http\Requests\Ingredient\UpdateIngredientQuoteRequest;
use App\Http\Requests\Ingredient\UpdateIngredientRequest;
use App\Models\Ingredient;
use App\Models\PriceHistory;
use App\Services\AlertService;
use App\Services\CostingService;
use App\Services\InventoryService;
use App\Services\RestockService;
use App\Support\Number;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly CostingService $costing,
        private readonly RestockService $restock,
        private readonly AlertService $alerts,
    ) {}

    public function index(Request $request): Response
    {
        $ingredients = Ingredient::orderBy('name')->get();

        $abc = collect($this->restock->buildParams())
            ->mapWithKeys(fn (array $p) => [$p['ingredient_id'] => $p['abc_class']]);

        $lastChanges = PriceHistory::where('type', 'purchase')
            ->whereIn('ingredient_id', $ingredients->pluck('id'))
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('ingredient_id')
            ->map(fn ($group) => $group->first());

        $rows = $ingredients->map(
            fn (Ingredient $i) => $this->resource($i, $abc[$i->id] ?? 'C', $lastChanges[$i->id] ?? null)
        );

        $inventoryValue = $ingredients->reduce(
            fn (string $carry, Ingredient $i) => bcadd($carry, bcmul(Number::str($i->current_stock), Number::str($i->cost_per_unit), 2), 0),
            '0'
        );

        return Inertia::render('ingredients', [
            'ingredients' => $rows,
            'meta' => [
                'count' => $ingredients->count(),
                'inventory_value' => (int) $inventoryValue,
                'low_stock_count' => $ingredients->filter(fn (Ingredient $i) => bccomp(Number::str($i->current_stock), Number::str($i->minimum_stock), 3) < 0)->count(),
                'quote_pending_count' => $ingredients->filter(fn (Ingredient $i) => $i->last_quote_price !== null && bccomp(Number::str($i->last_quote_price), Number::str($i->cost_per_unit), 4) > 0)->count(),
            ],
            'filters' => [
                'q' => $request->string('q')->toString(),
                'low_only' => $request->boolean('low_only'),
            ],
        ]);
    }

    public function store(StoreIngredientRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $cost = (string) ($data['cost_per_unit'] ?? 0);

        $ingredient = Ingredient::create([
            'name' => $data['name'],
            'base_unit' => $data['base_unit'],
            'current_stock' => 0,
            'minimum_stock' => $data['minimum_stock'] ?? 0,
            'cost_per_unit' => $cost,
            'lead_time_days' => $data['lead_time_days'] ?? 0,
            'review_period_days' => $data['review_period_days'] ?? 2,
            'package_size' => $data['package_size'] ?? null,
            'package_price' => $data['package_price'] ?? null,
            'moq_packages' => $data['moq_packages'] ?? 1,
            'is_active' => $data['is_active'] ?? true,
        ]);

        if (bccomp(Number::str($cost), '0', 4) > 0) {
            PriceHistory::create([
                'ingredient_id' => $ingredient->id,
                'type' => 'purchase',
                'old_value' => null,
                'new_value' => $cost,
                'reason' => 'initial',
                'user_id' => $request->user()?->id,
            ]);
        }

        return back()->with('success', 'Bahan '.$ingredient->name.' ditambahkan.');
    }

    public function update(UpdateIngredientRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $ingredient->fill($request->validated())->save();

        return back()->with('success', 'Bahan '.$ingredient->name.' diperbarui.');
    }

    public function destroy(Ingredient $ingredient): RedirectResponse
    {
        $ingredient->forceFill(['is_active' => false])->save();

        return back()->with('success', 'Bahan '.$ingredient->name.' dinonaktifkan.');
    }

    public function stockIn(StockInIngredientRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $data = $request->validated();

        if (isset($data['packages'])) {
            $packageSize = Number::str($ingredient->package_size ?? '1');
            $quantityBase = bcmul(Number::str($data['packages']), $packageSize, 3);
            $unitPrice = bcdiv(Number::str($data['price_per_package']), $packageSize, 4);
        } else {
            $quantityBase = Number::str($data['quantity_base']);
            $unitPrice = Number::str($data['unit_price_base']);
        }

        $this->inventory->stockIn(
            $ingredient,
            $quantityBase,
            $unitPrice,
            $request->user(),
            $data['reason'] ?? 'purchase',
        );

        $this->alerts->syncAll();

        return back()->with('success', 'Stock-in '.$ingredient->name.' tersimpan.');
    }

    public function quote(UpdateIngredientQuoteRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $data = $request->validated();
        $old = Number::str($ingredient->cost_per_unit);

        $ingredient->forceFill([
            'last_quote_price' => $data['quote_price'],
            'last_quote_at' => now(),
        ])->save();

        PriceHistory::create([
            'ingredient_id' => $ingredient->id,
            'type' => 'quote',
            'old_value' => $old,
            'new_value' => Number::str($data['quote_price']),
            'reason' => $data['reason'] ?? 'supplier_update',
            'user_id' => $request->user()?->id,
        ]);

        // Rekalkulasi HPP proyeksi menu terkait (BL §6.4-6.5).
        $this->costing->recalculateForIngredient($ingredient);

        $this->alerts->syncAll();

        return back()->with('success', 'Harga penawaran '.$ingredient->name.' diperbarui.');
    }

    public function adjustments(AdjustIngredientStockRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $this->inventory->adjust(
            $ingredient,
            Number::str($request->validated('qty_change')),
            $request->validated('type'),
            $request->validated('reason'),
            $request->user(),
        );

        $this->alerts->syncAll();

        return back()->with('success', 'Penyesuaian stok '.$ingredient->name.' tercatat.');
    }

    /**
     * @return array<string, mixed>
     */
    private function resource(Ingredient $ingredient, string $abcClass, ?PriceHistory $lastPurchase): array
    {
        $stock = Number::str($ingredient->current_stock);
        $minimum = Number::str($ingredient->minimum_stock);
        $cost = Number::str($ingredient->cost_per_unit);
        $quote = $ingredient->last_quote_price !== null ? Number::str($ingredient->last_quote_price) : null;

        return [
            'id' => $ingredient->id,
            'name' => $ingredient->name,
            'base_unit' => $ingredient->base_unit,
            'current_stock' => bcadd($stock, '0', 3),
            'minimum_stock' => bcadd($minimum, '0', 3),
            'cost_per_unit' => bcadd($cost, '0', 4),
            'last_quote_price' => $quote !== null ? bcadd($quote, '0', 4) : null,
            'package_size' => $ingredient->package_size !== null ? bcadd(Number::str($ingredient->package_size), '0', 3) : null,
            'package_price' => $ingredient->package_price,
            'lead_time_days' => $ingredient->lead_time_days,
            'moq_packages' => $ingredient->moq_packages,
            'is_active' => $ingredient->is_active,
            'abc_class' => $abcClass,
            'stock_status' => $this->stockStatus($stock, $minimum),
            'price_change_pct' => $lastPurchase !== null && $lastPurchase->old_value !== null
                ? $this->pct(Number::str($lastPurchase->old_value), Number::str($lastPurchase->new_value))
                : '0.00',
            'quote_change_pct' => $quote !== null && bccomp($cost, '0', 4) > 0
                ? $this->pct($cost, $quote)
                : '0.00',
        ];
    }

    /**
     * @return 'low'|'near'|'safe'
     */
    private function stockStatus(string $stock, string $minimum): string
    {
        $stock = Number::str($stock);
        $minimum = Number::str($minimum);

        if (bccomp($stock, $minimum, 3) < 0) {
            return 'low';
        }

        if (bccomp($stock, bcmul($minimum, '1.25', 3), 3) < 0) {
            return 'near';
        }

        return 'safe';
    }

    /**
     * @return numeric-string
     */
    private function pct(string $old, string $new): string
    {
        $old = Number::str($old);
        $new = Number::str($new);

        if (bccomp($old, '0', 8) === 0) {
            return '0.00';
        }

        return bcmul(bcdiv(bcsub($new, $old, 8), $old, 8), '100', 2);
    }
}
