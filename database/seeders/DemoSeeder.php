<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\PriceHistory;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\CostingService;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Seeder demo "Kopi & Toast Nusantara" (WBS 5.1, FR-038).
 * Memakai service nyata agar HPP/status ikut terhitung dan angka kanonik terjaga:
 * HPP "Es Kopi Susu Aren" = Rp11.244, proyeksi Rp12.294; margin 48,89% -> 44,12%.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $costing = app(CostingService::class);
        $inventory = app(InventoryService::class);

        $owner = User::where('role', 'owner')->first()
            ?? User::factory()->create(['name' => 'Bu Rina (Pemilik)', 'email' => 'owner@kulakan.com', 'role' => 'owner']);

        $ingredients = $this->seedIngredients();
        $menus = $this->seedMenus($ingredients, $costing);
        $this->seedPriceHistory($ingredients, $owner);
        $this->seedSalesHistory($menus, $inventory, $owner, $costing);
    }

    /**
     * @return array<string, Ingredient>
     */
    private function seedIngredients(): array
    {
        $rows = [
            // name, unit, stock(start), min, lead, pack_size, pack_price, cost, quote
            // stok awal = stok "hari ini" (snapshot BL 8.7) + konsumsi 7 hari, agar setelah seeder
            // keadaan terkini menyerupai contoh kanonik.
            ['Biji Kopi Arabika', 'gram', 4416, 500, 2, 500, 125000, 250, 300],
            ['Biji Kopi Robusta', 'gram', 1000, 300, 3, 500, 60000, 120, null],
            ['Susu UHT', 'ml', 30203, 2000, 1, 1000, 18000, 18, null],
            ['Gula Aren Cair', 'ml', 4412, 500, 2, 1000, 40000, 40, null],
            ['Cup + Lid', 'pcs', 304, 100, 3, 50, 25000, 500, null],
            ['Es Batu', 'gram', 24000, 3000, 1, 5000, 10000, 2, null],
            ['Matcha Powder', 'gram', 1500, 150, 5, 100, 85000, 850, null],
            ['Sirup Hazelnut', 'ml', 1040, 200, 3, 750, 95000, 95000 / 750, null],
            ['Roti Tawar', 'pcs', 200, 20, 1, 20, 30000, 1500, null],
            ['Keju Cheddar', 'gram', 4000, 500, 2, 1000, 120000, 120, null],
        ];

        $ingredients = [];
        foreach ($rows as [$name, $unit, $stock, $min, $lead, $packSize, $packPrice, $cost, $quote]) {
            $ingredients[$name] = Ingredient::create([
                'name' => $name,
                'base_unit' => $unit,
                'current_stock' => $stock,
                'minimum_stock' => $min,
                'cost_per_unit' => $cost,
                'last_quote_price' => $quote,
                'last_quote_at' => $quote !== null ? now() : null,
                'lead_time_days' => $lead,
                'review_period_days' => 2,
                'package_size' => $packSize,
                'package_price' => $packPrice,
                'moq_packages' => 1,
                'is_active' => true,
            ]);
        }

        return $ingredients;
    }

    /**
     * @param  array<string, Ingredient>  $ingredients
     * @return array<string, Menu>
     */
    private function seedMenus(array $ingredients, CostingService $costing): array
    {
        // name, category, price, overhead, BOM [nama => [qty, waste]]
        $definitions = [
            ['Es Kopi Susu Aren', 'Kopi', 22000, 1500, [
                'Biji Kopi Arabika' => [20, 0.05], 'Susu UHT' => [150, 0.02],
                'Gula Aren Cair' => [25, 0.04], 'Es Batu' => [100, 0], 'Cup + Lid' => [1, 0],
            ]],
            ['Kopi Hitam', 'Kopi', 15000, 500, [
                'Biji Kopi Arabika' => [16, 0.05], 'Cup + Lid' => [1, 0],
            ]],
            ['Hazelnut Latte', 'Kopi', 25000, 1500, [
                'Biji Kopi Arabika' => [20, 0.05], 'Susu UHT' => [250, 0.02],
                'Sirup Hazelnut' => [30, 0], 'Es Batu' => [100, 0], 'Cup + Lid' => [1, 0],
            ]],
            ['Roti Bakar Keju', 'Makanan', 18000, 1500, [
                'Roti Tawar' => [2, 0], 'Keju Cheddar' => [30, 0], 'Susu UHT' => [50, 0.02],
            ]],
            ['Matcha Latte', 'Non-Kopi', 26000, 1500, [
                'Matcha Powder' => [20, 0.05], 'Susu UHT' => [200, 0.02], 'Cup + Lid' => [1, 0],
            ]],
        ];

        $menus = [];
        foreach ($definitions as [$name, $category, $price, $overhead, $bom]) {
            $menu = Menu::create([
                'name' => $name,
                'category' => $category,
                'selling_price' => $price,
                'overhead' => $overhead,
                'is_active' => true,
            ]);

            $recipe = Recipe::create(['menu_id' => $menu->id, 'yield_portions' => 1]);
            foreach ($bom as $ingredientName => [$qty, $waste]) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'ingredient_id' => $ingredients[$ingredientName]->id,
                    'quantity_needed' => $qty,
                    'waste_factor' => $waste,
                ]);
            }

            $costing->recalculateMenu($menu->fresh());
            $menus[$name] = $menu;
        }

        return $menus;
    }

    /**
     * @param  array<string, Ingredient>  $ingredients
     */
    private function seedPriceHistory(array $ingredients, User $owner): void
    {
        $history = [
            ['Biji Kopi Arabika', 'purchase', null, 250, 'purchase'],
            ['Biji Kopi Arabika', 'quote', 250, 300, 'supplier_update'],
            ['Gula Aren Cair', 'purchase', 38, 40, 'purchase'],
            ['Keju Cheddar', 'purchase', 115, 120, 'purchase'],
        ];

        foreach ($history as [$name, $type, $old, $new, $reason]) {
            PriceHistory::create([
                'ingredient_id' => $ingredients[$name]->id,
                'type' => $type,
                'old_value' => $old,
                'new_value' => $new,
                'reason' => $reason,
                'user_id' => $owner->id,
            ]);
        }
    }

    /**
     * Riwayat penjualan 7 hari agar D_i dan ABC punya data (BL §8.2-8.3).
     *
     * @param  array<string, Menu>  $menus
     */
    private function seedSalesHistory(array $menus, InventoryService $inventory, User $owner, CostingService $costing): void
    {
        // Pola pesanan harian (nama menu => kuantitas).
        $dailyPattern = [
            'Es Kopi Susu Aren' => 16,
            'Kopi Hitam' => 10,
            'Hazelnut Latte' => 4,
            'Roti Bakar Keju' => 3,
            'Matcha Latte' => 2,
        ];

        for ($daysAgo = 6; $daysAgo >= 0; $daysAgo--) {
            $at = Carbon::now()->subDays($daysAgo)->setTime(10, 0);
            $lines = [];
            foreach ($dailyPattern as $menuName => $quantity) {
                $lines[] = ['menu_id' => $menus[$menuName]->id, 'quantity' => $quantity];
            }

            $order = $inventory->processOrder($lines, 'cash', null, $owner);

            $order->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
            $order->items()->update(['created_at' => $at, 'updated_at' => $at]);
            StockMovement::where('sales_order_id', $order->id)->update(['created_at' => $at]);

            // Nomor pesanan menyesuaikan tanggal transaksi.
            $order->forceFill([
                'order_number' => sprintf('ORD-%s-%04d', $at->format('Ymd'), $daysAgo + 1),
            ])->save();
        }

        // Segarkan lagi setelah transaksi (jaga-jaga bila status berubah).
        foreach ($menus as $menu) {
            $costing->recalculateMenu($menu->fresh());
        }
    }
}
