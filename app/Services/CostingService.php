<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\Menu;
use App\Support\Number;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Smart Recipe Costing: WAC, HPP aktual & proyeksi, margin, status (BL §6).
 * Semua aritmetika memakai bcmath (dilarang float untuk uang/kuantitas).
 */
class CostingService
{
    /**
     * Weighted Average Cost baru setelah stock-in (BL §6.2).
     *
     * @return numeric-string
     */
    public function weightedAverageCost(string $oldQty, string $oldCost, string $inQty, string $inCost): string
    {
        $oldQty = Number::str($oldQty);
        $oldCost = Number::str($oldCost);
        $inQty = Number::str($inQty);
        $inCost = Number::str($inCost);

        $newQty = bcadd($oldQty, $inQty, 6);

        if (bccomp($newQty, '0', 6) === 0) {
            return bcadd($oldCost, '0', 4);
        }

        $nominal = bcadd(bcmul($oldQty, $oldCost, 8), bcmul($inQty, $inCost, 8), 8);

        return $this->round(bcdiv($nominal, $newQty, 8), 4);
    }

    /**
     * Kuantitas efektif satu item BOM: q * (1 + waste) (BL §4.3).
     * waste_factor adalah pecahan 0-0.5 (mis. 0.05 = 5%).
     *
     * @return numeric-string
     */
    public function effectiveQty(string $qty, string $wasteFactor): string
    {
        return bcmul(Number::str($qty), bcadd('1', Number::str($wasteFactor), 6), 6);
    }

    /**
     * HPP aktual (cost_per_unit/WAC) atau proyeksi (harga penawaran terbaru) - BL §6.3-6.4.
     *
     * @return numeric-string
     */
    public function menuHpp(Menu $menu, bool $projected = false): string
    {
        $menu->loadMissing('recipe.items.ingredient');

        $subtotal = '0';
        $items = $menu->recipe?->items;

        if ($items !== null) {
            foreach ($items as $item) {
                $ingredient = $item->ingredient;
                $cost = $projected
                    ? ($ingredient->last_quote_price ?? $ingredient->cost_per_unit)
                    : $ingredient->cost_per_unit;

                $effective = $this->effectiveQty((string) $item->quantity_needed, (string) $item->waste_factor);
                $subtotal = bcadd($subtotal, bcmul($effective, Number::str($cost), 8), 8);
            }
        }

        return $this->round(bcadd($subtotal, Number::str($menu->overhead), 8), 2);
    }

    /**
     * Margin kotor % terhadap harga jual (BL §7.1).
     *
     * @return numeric-string
     */
    public function marginPct(Menu $menu, bool $projected = false): string
    {
        $price = Number::str($menu->selling_price);

        if (bccomp($price, '0', 2) === 0) {
            return '0.00';
        }

        $hpp = $this->menuHpp($menu, $projected);

        return $this->round(bcmul(bcdiv(bcsub($price, $hpp, 8), $price, 8), '100', 8), 2);
    }

    /**
     * Perkiraan porsi tersedia dari stok bahan / BOM (BL §4.2).
     * yield_portions membagi kuantitas per porsi.
     */
    public function portionsAvailable(Menu $menu): int
    {
        $menu->loadMissing('recipe.items.ingredient');

        $items = $menu->recipe?->items;
        if ($items === null || $items->isEmpty()) {
            return 0;
        }

        $yield = max(1, (int) $menu->recipe->yield_portions);
        $minimum = null;

        foreach ($items as $item) {
            if ($item->ingredient === null || ! $item->ingredient->is_active) {
                return 0;
            }

            $perPortion = bcdiv(
                $this->effectiveQty((string) $item->quantity_needed, (string) $item->waste_factor),
                (string) $yield,
                6
            );

            if (bccomp($perPortion, '0', 6) <= 0) {
                continue;
            }

            $available = (int) bcdiv(Number::str($item->ingredient->current_stock), $perPortion, 0);
            $minimum = $minimum === null ? $available : min($minimum, $available);
        }

        return $minimum ?? 0;
    }

    /**
     * Klasifikasi status menu (BL §7.3): profitable > 45%, watchlist 25-45% inklusif, loss < 25%.
     */
    public function statusForMargin(string $marginPct): string
    {
        $margin = Number::str($marginPct);

        if (bccomp($margin, '45', 2) > 0) {
            return 'profitable';
        }

        if (bccomp($margin, '25', 2) >= 0) {
            return 'watchlist';
        }

        return 'loss';
    }

    /**
     * Hitung ulang dan simpan HPP/margin/status satu menu (aktual + proyeksi) - DSD-09.
     */
    public function recalculateMenu(Menu $menu): Menu
    {
        $menu->loadMissing('recipe.items.ingredient');

        $actualHpp = $this->menuHpp($menu, false);
        $actualMargin = $this->marginPct($menu, false);

        $hasQuote = false;
        $items = $menu->recipe?->items;
        if ($items !== null) {
            $hasQuote = $items->contains(fn ($item) => $item->ingredient->last_quote_price !== null);
        }

        $projectedHpp = $hasQuote ? $this->menuHpp($menu, true) : null;
        $projectedMargin = $hasQuote ? $this->marginPct($menu, true) : null;

        $menu->forceFill([
            'current_hpp' => $actualHpp,
            'margin_pct' => $actualMargin,
            'status' => $this->statusForMargin($actualMargin),
            'projected_hpp' => $projectedHpp,
            'projected_margin_pct' => $projectedMargin,
            'projected_status' => $projectedMargin !== null ? $this->statusForMargin($projectedMargin) : null,
        ])->save();

        return $menu;
    }

    /**
     * Hitung ulang semua menu yang memakai bahan tertentu (BL §6.6).
     *
     * @return int jumlah menu yang dihitung ulang
     */
    public function recalculateForIngredient(Ingredient $ingredient): int
    {
        $menuIds = DB::table('recipe_ingredients')
            ->join('recipes', 'recipes.id', '=', 'recipe_ingredients.recipe_id')
            ->where('recipe_ingredients.ingredient_id', $ingredient->id)
            ->pluck('recipes.menu_id');

        $count = 0;
        foreach (Menu::whereIn('id', $menuIds)->get() as $menu) {
            $this->recalculateMenu($menu);
            $count++;
        }

        return $count;
    }

    /**
     * Simulasi what-if bila harga beli satu bahan diubah (BL §6.4, tanpa menyimpan apa pun).
     * Semua menu yang memakai bahan tersebut ikut dihitung ulang.
     *
     * @return list<array{menu_id:int, name:string, old_hpp:numeric-string, old_margin:numeric-string, old_status:string, new_hpp:numeric-string, new_margin:numeric-string, new_status:string}>
     */
    public function simulateIngredientPrice(Ingredient $ingredient, string $overrideCost): array
    {
        $overrideCost = Number::str($overrideCost);

        $menus = Menu::with('recipe.items.ingredient')
            ->whereHas('recipe.items', fn ($query) => $query->where('ingredient_id', $ingredient->id))
            ->orderBy('name')
            ->get();

        $rows = [];
        foreach ($menus as $menu) {
            $oldHpp = $this->menuHpp($menu, false);
            $oldMargin = $this->marginPct($menu, false);
            $newHpp = $this->hppWithOverride($menu, $ingredient->id, $overrideCost);
            $newMargin = $this->marginForHpp($menu, $newHpp);

            $rows[] = [
                'menu_id' => $menu->id,
                'name' => $menu->name,
                'old_hpp' => $oldHpp,
                'old_margin' => $oldMargin,
                'old_status' => $this->statusForMargin($oldMargin),
                'new_hpp' => $newHpp,
                'new_margin' => $newMargin,
                'new_status' => $this->statusForMargin($newMargin),
            ];
        }

        return $rows;
    }

    /**
     * Rata-rata margin aktual seluruh menu (BL §7.1).
     *
     * @return numeric-string
     */
    public function averageMargin(): string
    {
        $menus = Menu::all();

        if ($menus->isEmpty()) {
            return '0.00';
        }

        $sum = $menus->reduce(
            fn (string $carry, Menu $menu) => bcadd($carry, Number::str($menu->margin_pct), 6),
            '0'
        );

        return $this->round(bcdiv($sum, (string) $menus->count(), 6), 2);
    }

    /**
     * Agregat penjualan per menu untuk periode tertentu (BL §7.2).
     * Menghitung seluruh pesanan aktif selain `void`. Ranking menurut gross profit (GP) menurun.
     *
     * @return array{rows: list<array<string, mixed>>, totals: array<string, int>}
     */
    public function menuSalesAggregates(?CarbonInterface $since): array
    {
        $query = DB::table('sales_items')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_items.sales_order_id')
            ->join('menus', 'menus.id', '=', 'sales_items.menu_id')
            ->where('sales_orders.status', '!=', 'void')
            ->when($since !== null, fn ($q) => $q->where('sales_orders.created_at', '>=', $since))
            ->groupBy('menus.id', 'menus.name', 'menus.selling_price')
            ->selectRaw('menus.id as menu_id, menus.name as name, menus.selling_price as selling_price')
            ->selectRaw('SUM(sales_items.quantity) as quantity_sold')
            ->selectRaw('SUM(sales_items.quantity * sales_items.unit_price) as revenue')
            ->selectRaw('SUM(sales_items.quantity * sales_items.unit_hpp_at_sale) as cogs')
            ->get();

        $rows = [];
        $totalGp = '0';

        foreach ($query as $row) {
            $revenue = Number::str($row->revenue);
            $cogs = Number::str($row->cogs);
            $gp = bcsub($revenue, $cogs, 2);
            $totalGp = bcadd($totalGp, $gp, 2);

            $rows[] = [
                'menu_id' => (int) $row->menu_id,
                'name' => (string) $row->name,
                'selling_price' => (int) $row->selling_price,
                'quantity_sold' => (int) $row->quantity_sold,
                'revenue' => (int) $revenue,
                'cogs' => (int) $cogs,
                'gross_profit' => (int) $gp,
            ];
        }

        usort($rows, fn (array $a, array $b): int => $b['gross_profit'] <=> $a['gross_profit']);

        foreach ($rows as &$row) {
            $revenue = Number::str($row['revenue']);
            $gp = Number::str($row['gross_profit']);

            $row['gross_margin_pct'] = bccomp($revenue, '0', 2) === 0
                ? null
                : $this->round(bcmul(bcdiv($gp, $revenue, 8), '100', 8), 2);

            $row['contribution_pct'] = bccomp($totalGp, '0', 2) > 0
                ? $this->round(bcmul(bcdiv($gp, $totalGp, 8), '100', 8), 2)
                : null;
        }
        unset($row);

        return [
            'rows' => $rows,
            'totals' => [
                'revenue' => (int) array_sum(array_column($rows, 'revenue')),
                'cogs' => (int) array_sum(array_column($rows, 'cogs')),
                'gross_profit' => (int) $totalGp,
                'quantity_sold' => (int) array_sum(array_column($rows, 'quantity_sold')),
            ],
        ];
    }

    /**
     * HPP sebuah menu dengan mengganti harga satu bahan (what-if).
     *
     * @return numeric-string
     */
    private function hppWithOverride(Menu $menu, int $ingredientId, string $overrideCost): string
    {
        $menu->loadMissing('recipe.items.ingredient');
        $overrideCost = Number::str($overrideCost);

        $subtotal = '0';
        $items = $menu->recipe?->items;

        if ($items !== null) {
            foreach ($items as $item) {
                $cost = $item->ingredient_id === $ingredientId
                    ? $overrideCost
                    : Number::str($item->ingredient->cost_per_unit);

                $effective = $this->effectiveQty((string) $item->quantity_needed, (string) $item->waste_factor);
                $subtotal = bcadd($subtotal, bcmul($effective, $cost, 8), 8);
            }
        }

        return $this->round(bcadd($subtotal, Number::str($menu->overhead), 8), 2);
    }

    /**
     * Margin % terhadap harga jual untuk HPP tertentu.
     *
     * @return numeric-string
     */
    private function marginForHpp(Menu $menu, string $hpp): string
    {
        $price = Number::str($menu->selling_price);
        $hpp = Number::str($hpp);

        if (bccomp($price, '0', 2) === 0) {
            return '0.00';
        }

        return $this->round(bcmul(bcdiv(bcsub($price, $hpp, 8), $price, 8), '100', 8), 2);
    }

    /**
     * Pembulatan half-up untuk nilai numerik string (bcmath asli memotong/truncate).
     *
     * @return numeric-string
     */
    private function round(string $value, int $scale): string
    {
        $factor = bcpow('10', (string) $scale, 0);
        $scaled = bcmul(Number::str($value), $factor, 8);
        $biased = bcadd($scaled, bccomp($scaled, '0', 8) >= 0 ? '0.5' : '-0.5', 8);
        $integer = bcdiv($biased, '1', 0);

        return bcdiv($integer, $factor, $scale);
    }
}
