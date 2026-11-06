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
     * Fase 1 danai Qmin bahan urgen (all-or-nothing, else "kas tidak cukup"),
     * fase 2 top-up ke Qtarget, fase 3 bahan non-urgen bila >= MOQ.
     *
     * @param  array<int, array<string, mixed>>  $params
     * @return array{total_cost:int, remaining_cash:int, items:array<int, array<string, mixed>>}
     */
    public function planRestock(string $cash, array $params): array
    {
        // Urut prioritas desc, tie-break revenue desc, lalu nama asc (BL §8.6).
        usort($params, function (array $a, array $b): int {
            $byPriority = bccomp(Number::str($b['priority_score']), Number::str($a['priority_score']), 4);
            if ($byPriority !== 0) {
                return $byPriority;
            }

            $byRevenue = bccomp(Number::str($b['revenue_impact'] ?? '0'), Number::str($a['revenue_impact'] ?? '0'), 4);
            if ($byRevenue !== 0) {
                return $byRevenue;
            }

            return strcmp((string) $a['name'], (string) $b['name']);
        });

        $remaining = Number::str($cash);
        $bought = [];
        $labels = [];

        $urgent = array_values(array_filter(
            $params,
            fn (array $p) => (bool) $p['is_urgent'] && (int) $p['qtarget_packages'] > 0
        ));
        $nonUrgent = array_values(array_filter(
            $params,
            fn (array $p) => ! (bool) $p['is_urgent'] && (int) $p['qtarget_packages'] > 0
        ));

        // Fase 1 - bertahan hidup: danai Qmin bahan urgen (all-or-nothing).
        foreach ($urgent as $param) {
            $id = $param['ingredient_id'];
            $kmin = (int) $param['qmin_packages'];
            $cost = bcmul(Number::str($kmin), Number::str($param['package_price']), 2);

            if (bccomp($cost, $remaining, 2) <= 0) {
                $bought[$id] = $kmin;
                $remaining = bcsub($remaining, $cost, 2);
            } else {
                $bought[$id] = 0;
                $labels[$id] = 'kas_tidak_cukup';
            }
        }

        // Fase 2 - top-up bahan urgen ke Qtarget.
        foreach ($urgent as $param) {
            $id = $param['ingredient_id'];

            if (($labels[$id] ?? null) === 'kas_tidak_cukup') {
                continue;
            }

            $have = $bought[$id] ?? 0;
            $need = (int) $param['qtarget_packages'] - $have;
            $price = Number::str($param['package_price']);
            $extra = min($need, $this->affordable($remaining, $price));

            $bought[$id] = $have + $extra;
            $remaining = bcsub($remaining, bcmul(Number::str($extra), $price, 2), 2);
            $labels[$id] = $bought[$id] >= (int) $param['qtarget_packages']
                ? 'beli_sekarang'
                : 'beli_sekarang_parsial';
        }

        // Fase 3 - bahan non-urgen bila kas tersisa dan memenuhi MOQ.
        foreach ($nonUrgent as $param) {
            $id = $param['ingredient_id'];
            $price = Number::str($param['package_price']);
            $moq = (int) ($param['moq_packages'] ?? 1);
            $k = min((int) $param['qtarget_packages'], $this->affordable($remaining, $price));

            if ($k > 0 && $k >= $moq) {
                $bought[$id] = $k;
                $remaining = bcsub($remaining, bcmul(Number::str($k), $price, 2), 2);
                $labels[$id] = 'beli_opsional';
            } else {
                $bought[$id] = 0;
                $labels[$id] = 'tahan_dulu';
            }
        }

        $items = [];
        $total = '0';
        foreach ($params as $param) {
            $id = $param['ingredient_id'];
            $got = $bought[$id] ?? 0;
            $cost = bcmul(Number::str($got), Number::str($param['package_price']), 0);
            $total = bcadd($total, $cost, 0);

            $items[] = array_merge($param, [
                'recommended_packages' => $got,
                'estimated_cost' => (int) $cost,
                'label' => $labels[$id] ?? 'tahan_dulu',
            ]);
        }

        return [
            'total_cost' => (int) $total,
            'remaining_cash' => (int) $remaining,
            'items' => $items,
        ];
    }

    /**
     * Bangun parameter planner dari data aktual (BL §8.2, §8.3, §8.5, §8.9).
     *
     * D_i = sum|sale + waste| 7 hari / N_effective (hari berdata, maks 7);
     * bila riwayat < 3 hari maka D_i = 0 (tanpa estimasi manual).
     *
     * @return array<int, array<string, mixed>>
     */
    public function buildParams(int $consumptionDays = 7, int $reviewPeriodDays = 2, ?int $maxDaysLeadTime = null): array
    {
        $since = now()->subDays($consumptionDays);

        $sums = DB::table('stock_movements')
            ->whereIn('type', ['sale', 'waste'])
            ->where('created_at', '>=', $since)
            ->selectRaw('ingredient_id, SUM(ABS(qty_change)) as total')
            ->groupBy('ingredient_id')
            ->pluck('total', 'ingredient_id')
            ->all();

        $effectiveDays = (int) DB::table('stock_movements')
            ->whereIn('type', ['sale', 'waste'])
            ->where('created_at', '>=', $since)
            ->selectRaw('COUNT(DISTINCT DATE(created_at)) as days')
            ->value('days');
        $effectiveDays = min($consumptionDays, $effectiveDays);

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
        $query = Ingredient::where('is_active', true)->orderBy('id');
        if ($maxDaysLeadTime !== null) {
            $query->where('lead_time_days', '<=', $maxDaysLeadTime);
        }

        foreach ($query->get() as $ingredient) {
            $daily = $effectiveDays >= 3
                ? bcdiv(Number::str($sums[$ingredient->id] ?? '0'), Number::str($effectiveDays), 6)
                : '0.000000';

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
                'moq_packages' => $ingredient->moq_packages,
                'abc_class' => $abcClass,
                'revenue_impact' => bcadd(Number::str($revenue[$ingredient->id] ?? '0'), '0', 2),
                'urgency' => $urgency,
                'is_urgent' => bccomp($urgency, '1', 4) >= 0,
                'priority_score' => $this->priorityScore($urgency, $abcClass),
            ], $quantities);
        }

        return $params;
    }

    /**
     * floor(remaining / price); price 0 = gratis (seluruh kebutuhan terjangkau).
     */
    private function affordable(string $remaining, string $price): int
    {
        $price = Number::str($price);

        if (bccomp($price, '0', 2) === 0) {
            return PHP_INT_MAX;
        }

        return (int) bcdiv(Number::str($remaining), $price, 0);
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
