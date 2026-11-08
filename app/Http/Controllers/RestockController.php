<?php

namespace App\Http\Controllers;

use App\Http\Requests\Restock\StoreRestockPlanRequest;
use App\Models\Ingredient;
use App\Models\RestockPlan;
use App\Models\RestockPlanItem;
use App\Services\AlertService;
use App\Services\InventoryService;
use App\Services\RestockService;
use App\Support\Number;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RestockController extends Controller
{
    private const DEFAULT_CASH = 500000;

    private const DEFAULT_MAX_LEAD = 3;

    public function __construct(
        private readonly RestockService $restock,
        private readonly InventoryService $inventory,
        private readonly AlertService $alerts,
    ) {}

    public function index(Request $request): Response
    {
        $cash = $request->has('cash') ? max(0, $request->integer('cash')) : self::DEFAULT_CASH;
        $maxDaysLead = $request->has('max_days_lead_time')
            ? max(0, $request->integer('max_days_lead_time'))
            : self::DEFAULT_MAX_LEAD;

        $lastPlan = RestockPlan::with('items')->orderByDesc('id')->first();

        return Inertia::render('restock', [
            'default_cash_amount' => self::DEFAULT_CASH,
            'max_days_lead_time' => $maxDaysLead,
            'presets' => [300000, 500000, 750000, 1000000],
            'plan' => $this->buildPlan($cash, $maxDaysLead),
            'last_plan' => $lastPlan !== null ? $this->planResource($lastPlan) : null,
        ]);
    }

    public function store(StoreRestockPlanRequest $request): RedirectResponse
    {
        $cash = (int) $request->validated('cash_amount');
        $maxDaysLead = (int) ($request->validated('max_days_lead_time') ?? self::DEFAULT_MAX_LEAD);
        $plan = $this->buildPlan($cash, $maxDaysLead);

        $restockPlan = DB::transaction(function () use ($cash, $plan, $request): RestockPlan {
            /** @var RestockPlan $restockPlan */
            $restockPlan = RestockPlan::create([
                'user_id' => $request->user()->id,
                'cash_amount' => $cash,
                'total_cost' => $plan['total_cost'],
                'remaining_cash' => $plan['remaining_cash'],
                'status' => 'draft',
            ]);

            foreach ($plan['items'] as $item) {
                RestockPlanItem::create([
                    'restock_plan_id' => $restockPlan->id,
                    'ingredient_id' => $item['ingredient_id'],
                    'urgency' => $item['urgency'],
                    'is_urgent' => $item['is_urgent'],
                    'abc_class' => $item['abc_class'],
                    'priority_score' => $item['priority_score'],
                    'qmin_packages' => $item['qmin_packages'],
                    'qtarget_packages' => $item['qtarget_packages'],
                    'recommended_packages' => $item['recommended_packages'],
                    'estimated_cost' => $item['estimated_cost'],
                    'label' => $item['label'],
                ]);
            }

            return $restockPlan;
        });

        return back()->with('success', 'Rencana belanja #'.$restockPlan->id.' tersimpan (draft), total Rp '.number_format($plan['total_cost'], 0, ',', '.').'.');
    }

    public function purchase(Request $request, RestockPlan $restockPlan): RedirectResponse
    {
        try {
            DB::transaction(function () use ($restockPlan, $request): void {
                /** @var RestockPlan $plan */
                $plan = RestockPlan::whereKey($restockPlan->id)->lockForUpdate()->firstOrFail();

                // Proteksi SEC-03: Cegah TOCTOU race condition pada eksekusi restock
                if ($plan->status === 'purchased') {
                    throw new \InvalidArgumentException('Rencana ini sudah ditandai dibeli.');
                }

                $items = $plan->items()->with('ingredient')->get();

                foreach ($items as $item) {
                    if ($item->recommended_packages <= 0) {
                        $item->forceFill(['purchased_packages' => 0])->save();

                        continue;
                    }

                    /** @var Ingredient $ingredient */
                    $ingredient = $item->ingredient;
                    $packageSize = Number::str($ingredient->package_size ?? '1');
                    $quantity = bcmul(Number::str($item->recommended_packages), $packageSize, 3);
                    $unitPrice = Number::str($ingredient->last_quote_price ?? $ingredient->cost_per_unit);

                    $this->inventory->stockIn($ingredient, $quantity, $unitPrice, $request->user(), 'restock');

                    $item->forceFill(['purchased_packages' => $item->recommended_packages])->save();
                }

                $plan->forceFill([
                    'status' => 'purchased',
                    'purchased_at' => now(),
                ])->save();
            });
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['plan' => $e->getMessage()]);
        }

        $this->alerts->syncAll();

        return back()->with('success', 'Rencana #'.$restockPlan->id.' ditandai dibeli; stok bahan bertambah sesuai rekomendasi.');
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPlan(int $cash, int $maxDaysLead): array
    {
        $params = $this->restock->buildParams(7, 2, $maxDaysLead);
        $plan = $this->restock->planRestock((string) $cash, $params);

        return [
            'cash_amount' => $cash,
            'total_cost' => $plan['total_cost'],
            'remaining_cash' => $plan['remaining_cash'],
            'items' => array_map(static fn (array $item): array => [
                'ingredient_id' => $item['ingredient_id'],
                'name' => $item['name'],
                'base_unit' => $item['base_unit'],
                'abc_class' => $item['abc_class'],
                'is_urgent' => (bool) $item['is_urgent'],
                'urgency' => $item['urgency'],
                'priority_score' => $item['priority_score'],
                'qmin_packages' => (int) $item['qmin_packages'],
                'qtarget_packages' => (int) $item['qtarget_packages'],
                'recommended_packages' => (int) $item['recommended_packages'],
                'package_size' => $item['package_size'],
                'package_price' => (int) $item['package_price'],
                'estimated_cost' => (int) $item['estimated_cost'],
                'label' => $item['label'],
            ], $plan['items']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function planResource(RestockPlan $plan): array
    {
        return [
            'id' => $plan->id,
            'status' => $plan->status,
            'cash_amount' => $plan->cash_amount,
            'total_cost' => $plan->total_cost,
            'remaining_cash' => $plan->remaining_cash,
            'created_at' => $plan->created_at?->toIso8601String(),
            'purchased_at' => $plan->purchased_at?->toIso8601String(),
            'items' => $plan->items->map(fn (RestockPlanItem $item) => [
                'ingredient_id' => $item->ingredient_id,
                'recommended_packages' => $item->recommended_packages,
                'estimated_cost' => $item->estimated_cost,
                'label' => $item->label,
                'purchased_packages' => $item->purchased_packages,
            ])->values(),
        ];
    }
}
