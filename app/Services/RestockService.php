<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Support\Number;
use Illuminate\Support\Facades\DB;

/**
 * Cashflow-Aware Reorder Planner: analisis ABC, skor urgensi, Greedy 3 fase (BL §8).
 * Komputasi murni, tidak menyimpan apa pun (FR-030).
 */
class RestockService
{
    /**
     * Skor urgensi U_i = (D_i * L_i) / S_i (BL §8.4).
     *
     * @return numeric-string
     */
    public function urgency(string $stock, string $dailyConsumption, int $leadTimeDays): string
    {
        $stock = Number::str($stock);

        if (bccomp($stock, '0', 6) <= 0) {
            // Stok habis = urgensi sangat tinggi.
            return '999999.0000';
        }

        return bcdiv(bcmul(Number::str($dailyConsumption), Number::str($leadTimeDays), 6), $stock, 4);
    }

    /**
     * Skor prioritas = U * W (W: A=3, B=2, C=1) (BL §8.5).
     *
     * @return numeric-string
     */
    public function priorityScore(string $urgency, string $abcClass): string
    {
        $weight = match ($abcClass) {
            'A' => '3',
            'B' => '2',
            default => '1',
        };

        return bcmul(Number::str($urgency), $weight, 4);
    }

    /**
     * Klasifikasi ABC dari kontribusi kumulatif pendapatan (BL §8.3, DEC-08).
     *
     * @param  array<int, float|int|string>  $revenueByIngredient  ingredient_id => revenue
     * @return array<int, string> ingredient_id => A|B|C
     */
    public function abcClasses(array $revenueByIngredient): array
    {
        arsort($revenueByIngredient);
        $total = array_sum(array_map('floatval', $revenueByIngredient));

        $result = [];
        $cumulative = 0.0;

        foreach ($revenueByIngredient as $ingredientId => $revenue) {
            if ((float) $revenue <= 0.0) {
                $result[$ingredientId] = 'C';

                continue;
            }

            $cumulative += (float) $revenue;
            $pct = $total > 0 ? ($cumulative / $total) * 100 : 100.0;

            $result[$ingredientId] = $pct <= 80 ? 'A' : ($pct <= 95 ? 'B' : 'C');
        }

        return $result;
    }

    /**
     * Kuantitas minimum/target dalam kemasan (BL §8.5).
     *
     * @return array{qmin_packages:int, qtarget_packages:int}
     */
    public function packageQuantities(
        string $stock,
        string $dailyConsumption,
        int $leadTimeDays,
        int $reviewPeriodDays,
        string $packageSize,
        int $moqPackages = 1,
    ): array {
        $daily = Number::str($dailyConsumption);
        $stock = Number::str($stock);

        $qmin = bcsub(bcmul($daily, Number::str($leadTimeDays), 6), $stock, 6);
        $qtarget = bcsub(bcmul($daily, Number::str($leadTimeDays + $reviewPeriodDays), 6), $stock, 6);

        return [
            'qmin_packages' => $this->ceilPackages($qmin, $packageSize, $moqPackages),
            'qtarget_packages' => $this->ceilPackages($qtarget, $packageSize, $moqPackages),
        ];
    }

    /**
     * Greedy 3 fase dengan jaminan total <= kas (BL §8.6, INV-05/06).
     *
     * @param  array<int, array<string, mixed>>  $params
     * @return array{total_cost:int, remaining_cash:int, items:array<int, array<string, mixed>>}
     */
    public function planRestock(string $cash, array $params): array
    {
        usort(
            $params,
            fn ($a, $b) => bccomp(Number::str($b['priority_score']), Number::str($a['priority_score']), 4)
        );

        $remaining = bcadd(Number::str($cash), '0', 2);
        $recommended = [];

        $fund = function (array $param, int $count) use (&$remaining, &$recommended): void {
            $price = Number::str($param['package_price']);
            for ($i = 0; $i < $count; $i++) {
                if (bccomp($remaining, $price, 2) >= 0) {
                    $remaining = bcsub($remaining, $price, 2);
                    $recommended[$param['ingredient_id']] = ($recommended[$param['ingredient_id']] ?? 0) + 1;
                } else {
                    break;
                }
            }
        };

        $urgent = array_values(array_filter($params, fn ($p) => (bool) $p['is_urgent']));
        $optional = array_values(array_filter($params, fn ($p) => ! (bool) $p['is_urgent']));

        // Fase 1: penuhi Qmin seluruh bahan urgen.
        foreach ($urgent as $param) {
            $fund($param, (int) $param['qmin_packages']);
        }
        // Fase 2: lanjutkan ke Qtarget untuk bahan urgen.
        foreach ($urgent as $param) {
            $fund($param, (int) $param['qtarget_packages'] - ($recommended[$param['ingredient_id']] ?? 0));
        }
        // Fase 3: bahan non-urgen bila kas masih ada.
        foreach ($optional as $param) {
            $fund($param, (int) $param['qtarget_packages']);
        }

        $items = [];
        $total = '0';
        foreach ($params as $param) {
            $got = $recommended[$param['ingredient_id']] ?? 0;
            $cost = bcmul(Number::str($got), Number::str($param['package_price']), 0);
            $total = bcadd($total, $cost, 0);

            $items[] = array_merge($param, [
                'recommended_packages' => $got,
                'estimated_cost' => (int) $cost,
                'label' => $this->label((bool) $param['is_urgent'], $got, (int) $param['qtarget_packages']),
            ]);
        }

        return [
            'total_cost' => (int) $total,
            'remaining_cash' => (int) $remaining,
            'items' => $items,
        ];
    }

    /**
     * Bangun parameter planner dari data aktual (konsumsi 7 hari, ABC, urgensi, kemasan).
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildParams(int $consumptionDays = 7, int $reviewPeriodDays = 2): array
    {
        $since = now()->subDays($consumptionDays);

        $consumption = DB::table('stock_movements')
            ->where('type', 'sale')
            ->where('created_at', '>=', $since)
            ->selectRaw('ingredient_id, SUM(-qty_change) as total')
            ->groupBy('ingredient_id')
            ->pluck('total', 'ingredient_id')
            ->all();

        $revenue = DB::table('sales_items')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_items.sales_order_id')
            ->join('recipes', 'recipes.menu_id', '=', 'sales_items.menu_id')
            ->join('recipe_ingredients', 'recipe_ingredients.recipe_id', '=', 'recipes.id')
            ->where('sales_orders.status', 'completed')
            ->where('sales_orders.created_at', '>=', $since)
            ->selectRaw('recipe_ingredients.ingredient_id, SUM(sales_items.quantity * sales_items.unit_price) as revenue')
            ->groupBy('recipe_ingredients.ingredient_id')
            ->pluck('revenue', 'ingredient_id')
            ->all();

        $abc = $this->abcClasses($revenue);

        $params = [];
        foreach (Ingredient::where('is_active', true)->orderBy('id')->get() as $ingredient) {
            $daily = bcdiv(Number::str($consumption[$ingredient->id] ?? '0'), Number::str($consumptionDays), 6);

            $packageSize = Number::str($ingredient->package_size ?? '1');
            $purchasePrice = Number::str($ingredient->last_quote_price ?? $ingredient->cost_per_unit);
            $packagePrice = (int) bcdiv(bcadd(bcmul($purchasePrice, $packageSize, 4), '0.5', 4), '1', 0);

            $stock = Number::str($ingredient->current_stock);
            $urgency = $this->urgency($stock, $daily, $ingredient->lead_time_days);
            $abcClass = $abc[$ingredient->id] ?? 'C';
            $quantities = $this->packageQuantities(
                $stock,
                $daily,
                $ingredient->lead_time_days,
                $ingredient->review_period_days ?: $reviewPeriodDays,
                $packageSize,
                $ingredient->moq_packages,
            );

            $params[] = array_merge([
                'ingredient_id' => $ingredient->id,
                'name' => $ingredient->name,
                'base_unit' => $ingredient->base_unit,
                'current_stock' => bcadd($stock, '0', 3),
                'daily_consumption' => $daily,
                'lead_time_days' => $ingredient->lead_time_days,
                'package_size' => $packageSize,
                'package_price' => $packagePrice,
                'abc_class' => $abcClass,
                'urgency' => $urgency,
                'is_urgent' => bccomp($urgency, '1', 4) >= 0,
                'priority_score' => $this->priorityScore($urgency, $abcClass),
            ], $quantities);
        }

        return $params;
    }

    private function label(bool $urgent, int $got, int $target): string
    {
        if ($got <= 0) {
            return $urgent ? 'kas_tidak_cukup' : 'tahan_dulu';
        }

        if ($got >= $target) {
            return $urgent ? 'beli_sekarang' : 'beli_opsional';
        }

        return 'beli_sekarang_parsial';
    }

    private function ceilPackages(string $quantity, string $packageSize, int $moqPackages): int
    {
        $quantity = Number::str($quantity);

        if (bccomp($quantity, '0', 6) <= 0) {
            return 0;
        }

        $size = Number::str($packageSize);
        if (bccomp($size, '0', 6) === 0) {
            $size = '1';
        }

        $packages = (int) ceil((float) bcdiv($quantity, $size, 6));

        if ($packages > 0 && $packages < $moqPackages) {
            $packages = $moqPackages;
        }

        return $packages;
    }
}
