<?php

namespace App\Http\Controllers;

use App\Http\Requests\Restock\StoreRestockPlanRequest;
use App\Models\Ingredient;
use App\Models\RestockPlan;
use App\Models\RestockPlanItem;
use App\Models\User;
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

        $lastPlan = RestockPlan::with(['user', 'items'])->orderByDesc('id')->first();
        $recentPlans = RestockPlan::with('user')->orderByDesc('id')->take(5)->get();

        return Inertia::render('restock', [
            'default_cash_amount' => self::DEFAULT_CASH,
            'max_days_lead_time' => $maxDaysLead,
            'presets' => [300000, 500000, 750000, 1000000],
            'plan' => $this->buildPlan($cash, $maxDaysLead),
            'last_plan' => $lastPlan !== null ? $this->planResource($lastPlan) : null,
            'recent_plans' => $recentPlans->map(fn (RestockPlan $p) => [
                'id' => $p->id,
                'status' => $p->status,
                'cash_amount' => $p->cash_amount,
                'total_cost' => $p->total_cost,
                'remaining_cash' => $p->remaining_cash,
                'created_at' => $p->created_at?->toIso8601String(),
                'creator_name' => $p->user?->name,
                'items_count' => $p->items->count(),
            ])->values(),
            'users' => User::select('id', 'name', 'role')->orderBy('name')->get(),
            'ingredients' => Ingredient::where('is_active', true)
                ->select('id', 'name', 'base_unit', 'package_size', 'package_price', 'current_stock')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function show(RestockPlan $restockPlan): Response
    {
        $restockPlan->load(['user', 'items.ingredient']);
        $recentPlans = RestockPlan::with('user')->orderByDesc('id')->take(5)->get();

        return Inertia::render('restock-plan-detail', [
            'plan' => $this->detailedPlanResource($restockPlan),
            'recent_plans' => $recentPlans->map(fn (RestockPlan $p) => [
                'id' => $p->id,
                'status' => $p->status,
                'cash_amount' => $p->cash_amount,
                'total_cost' => $p->total_cost,
                'remaining_cash' => $p->remaining_cash,
                'created_at' => $p->created_at?->toIso8601String(),
                'creator_name' => $p->user?->name,
                'items_count' => $p->items->count(),
            ])->values(),
        ]);
    }

    public function store(StoreRestockPlanRequest $request): RedirectResponse
    {
        $cash = (int) $request->validated('cash_amount');
        $maxDaysLead = (int) ($request->validated('max_days_lead_time') ?? self::DEFAULT_MAX_LEAD);
        $status = (string) ($request->validated('status') ?? 'draft');
        $deliveryDate = $request->validated('delivery_date');
        $assignedUserId = $request->validated('assigned_user_id');
        $paymentTerms = $request->validated('payment_terms');
        $customNotes = $request->validated('notes');

        // Gabungkan catatan operasional jika ada info delivery/terms
        $combinedNotes = $customNotes;
        if ($deliveryDate || $paymentTerms) {
            $prefixParts = [];
            if ($deliveryDate) {
                $prefixParts[] = "Target: {$deliveryDate}";
            }
            if ($paymentTerms) {
                $prefixParts[] = "Bayar: {$paymentTerms}";
            }
            $combinedNotes = implode(' • ', $prefixParts).($customNotes ? "\n{$customNotes}" : '');
        }

        $submittedItems = $request->validated('items');

        $restockPlan = DB::transaction(function () use (
            $cash,
            $maxDaysLead,
            $status,
            $assignedUserId,
            $combinedNotes,
            $submittedItems,
            $request
        ): RestockPlan {
            if (is_array($submittedItems) && count($submittedItems) > 0) {
                $totalCost = 0;
                $itemsToInsert = [];
                $allIngredients = Ingredient::whereIn('id', array_column($submittedItems, 'ingredient_id'))->get()->keyBy('id');

                foreach ($submittedItems as $sItem) {
                    $ingId = (int) $sItem['ingredient_id'];
                    $ing = $allIngredients[$ingId] ?? null;
                    if (! $ing) {
                        continue;
                    }

                    $packages = max(0, (int) $sItem['recommended_packages']);
                    $price = (int) ($ing->package_price ?? 0);
                    $estCost = $packages * $price;
                    $totalCost += $estCost;

                    $itemsToInsert[] = [
                        'ingredient_id' => $ingId,
                        'urgency' => null,
                        'is_urgent' => false,
                        'abc_class' => 'B',
                        'priority_score' => null,
                        'qmin_packages' => 0,
                        'qtarget_packages' => $packages,
                        'recommended_packages' => $packages,
                        'estimated_cost' => $estCost,
                        'label' => $packages > 0 ? 'beli_sekarang' : 'tahan_dulu',
                    ];
                }

                $remainingCash = max(0, $cash - $totalCost);

                /** @var RestockPlan $restockPlan */
                $restockPlan = RestockPlan::create([
                    'user_id' => $assignedUserId ?: $request->user()->id,
                    'cash_amount' => $cash,
                    'total_cost' => $totalCost,
                    'remaining_cash' => $remainingCash,
                    'status' => $status,
                    'ordered_at' => $status === 'ordered' ? now() : null,
                    'approved_at' => $status === 'approved' ? now() : null,
                    'notes' => $combinedNotes,
                ]);

                foreach ($itemsToInsert as $item) {
                    RestockPlanItem::create([
                        'restock_plan_id' => $restockPlan->id,
                        ...$item,
                    ]);
                }
            } else {
                $plan = $this->buildPlan($cash, $maxDaysLead);

                /** @var RestockPlan $restockPlan */
                $restockPlan = RestockPlan::create([
                    'user_id' => $assignedUserId ?: $request->user()->id,
                    'cash_amount' => $cash,
                    'total_cost' => $plan['total_cost'],
                    'remaining_cash' => $plan['remaining_cash'],
                    'status' => $status,
                    'ordered_at' => $status === 'ordered' ? now() : null,
                    'approved_at' => $status === 'approved' ? now() : null,
                    'notes' => $combinedNotes,
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
            }

            return $restockPlan;
        });

        return redirect()->route('restock.plans.show', $restockPlan)
            ->with('success', 'Rencana belanja #'.$restockPlan->id.' berhasil dibuat.');
    }

    public function approve(Request $request, RestockPlan $restockPlan): RedirectResponse
    {
        try {
            DB::transaction(function () use ($restockPlan): void {
                /** @var RestockPlan $plan */
                $plan = RestockPlan::whereKey($restockPlan->id)->lockForUpdate()->firstOrFail();

                if ($plan->status !== 'draft') {
                    throw new \InvalidArgumentException('Hanya rencana berstatus draft yang dapat disetujui.');
                }

                $plan->forceFill([
                    'status' => 'approved',
                    'approved_at' => now(),
                ])->save();
            });
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['plan' => $e->getMessage()]);
        }

        return back()->with('success', 'Rencana #'.$restockPlan->id.' telah disetujui.');
    }

    public function order(Request $request, RestockPlan $restockPlan): RedirectResponse
    {
        try {
            DB::transaction(function () use ($restockPlan, $request): void {
                /** @var RestockPlan $plan */
                $plan = RestockPlan::whereKey($restockPlan->id)->lockForUpdate()->firstOrFail();

                if (! in_array($plan->status, ['draft', 'approved'], true)) {
                    throw new \InvalidArgumentException('Rencana ini tidak dapat diubah ke status dipesan.');
                }

                $notes = $request->input('notes');

                $plan->forceFill([
                    'status' => 'ordered',
                    'ordered_at' => now(),
                    'notes' => $notes !== null ? (string) $notes : $plan->notes,
                ])->save();
            });
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['plan' => $e->getMessage()]);
        }

        return back()->with('success', 'Rencana #'.$restockPlan->id.' ditandai sudah dipesan (PO dikirim).');
    }

    public function cancel(Request $request, RestockPlan $restockPlan): RedirectResponse
    {
        try {
            DB::transaction(function () use ($restockPlan, $request): void {
                /** @var RestockPlan $plan */
                $plan = RestockPlan::whereKey($restockPlan->id)->lockForUpdate()->firstOrFail();

                if (in_array($plan->status, ['purchased', 'cancelled'], true)) {
                    throw new \InvalidArgumentException('Rencana yang sudah dibeli atau dibatalkan tidak dapat diubah.');
                }

                $reason = $request->input('reason', 'Dibatalkan oleh pengguna');

                $plan->forceFill([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => (string) $reason,
                ])->save();
            });
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['plan' => $e->getMessage()]);
        }

        return back()->with('success', 'Rencana #'.$restockPlan->id.' berhasil dibatalkan.');
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

                if ($plan->status === 'cancelled') {
                    throw new \InvalidArgumentException('Rencana yang dibatalkan tidak dapat dieksekusi.');
                }

                $submittedItems = $request->input('items');
                $indexedSubmitted = [];
                if (is_array($submittedItems)) {
                    foreach ($submittedItems as $sItem) {
                        if (is_array($sItem) && isset($sItem['ingredient_id'])) {
                            $indexedSubmitted[(int) $sItem['ingredient_id']] = $sItem;
                        }
                    }
                }

                $items = $plan->items()->with('ingredient')->get();
                $totalActualCost = 0;

                foreach ($items as $item) {
                    $ingId = $item->ingredient_id;
                    $submitted = $indexedSubmitted[$ingId] ?? null;

                    if ($submitted !== null) {
                        $purchasedPackages = max(0, (int) ($submitted['purchased_packages'] ?? 0));
                        $packagePrice = isset($submitted['actual_package_price'])
                            ? max(0, (int) $submitted['actual_package_price'])
                            : (int) ($item->ingredient->package_price ?? 0);
                        $itemNotes = isset($submitted['notes']) ? (string) $submitted['notes'] : null;
                    } else {
                        $purchasedPackages = $item->recommended_packages;
                        $packagePrice = (int) ($item->ingredient->package_price ?? 0);
                        $itemNotes = null;
                    }

                    $itemCost = $purchasedPackages * $packagePrice;
                    $totalActualCost += $itemCost;

                    if ($purchasedPackages > 0 && $item->ingredient !== null) {
                        /** @var Ingredient $ingredient */
                        $ingredient = $item->ingredient;
                        $packageSize = Number::str($ingredient->package_size ?? '1');
                        $quantity = bcmul(Number::str($purchasedPackages), $packageSize, 3);
                        $unitPrice = Number::str($ingredient->last_quote_price ?? $ingredient->cost_per_unit);

                        $this->inventory->stockIn($ingredient, $quantity, $unitPrice, $request->user(), 'restock');
                    }

                    $item->forceFill([
                        'purchased_packages' => $purchasedPackages,
                        'actual_cost' => $itemCost,
                        'notes' => $itemNotes,
                    ])->save();
                }

                $planNotes = $request->input('notes');

                $plan->forceFill([
                    'status' => 'purchased',
                    'purchased_at' => now(),
                    'actual_cost' => $totalActualCost,
                    'notes' => $planNotes !== null ? (string) $planNotes : $plan->notes,
                ])->save();
            });
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['plan' => $e->getMessage()]);
        }

        $this->alerts->syncAll();

        return back()->with('success', 'Rencana #'.$restockPlan->id.' berhasil diselesaikan; stok bahan telah diperbarui.');
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
            'actual_cost' => $plan->actual_cost,
            'remaining_cash' => $plan->remaining_cash,
            'created_at' => $plan->created_at?->toIso8601String(),
            'approved_at' => $plan->approved_at?->toIso8601String(),
            'ordered_at' => $plan->ordered_at?->toIso8601String(),
            'purchased_at' => $plan->purchased_at?->toIso8601String(),
            'cancelled_at' => $plan->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $plan->cancellation_reason,
            'notes' => $plan->notes,
            'creator_name' => $plan->user?->name,
            'items' => $plan->items->map(fn (RestockPlanItem $item) => [
                'ingredient_id' => $item->ingredient_id,
                'recommended_packages' => $item->recommended_packages,
                'estimated_cost' => $item->estimated_cost,
                'actual_cost' => $item->actual_cost,
                'label' => $item->label,
                'purchased_packages' => $item->purchased_packages,
                'notes' => $item->notes,
            ])->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function detailedPlanResource(RestockPlan $plan): array
    {
        return [
            'id' => $plan->id,
            'status' => $plan->status,
            'cash_amount' => $plan->cash_amount,
            'total_cost' => $plan->total_cost,
            'actual_cost' => $plan->actual_cost,
            'remaining_cash' => $plan->remaining_cash,
            'created_at' => $plan->created_at?->toIso8601String(),
            'approved_at' => $plan->approved_at?->toIso8601String(),
            'ordered_at' => $plan->ordered_at?->toIso8601String(),
            'purchased_at' => $plan->purchased_at?->toIso8601String(),
            'cancelled_at' => $plan->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $plan->cancellation_reason,
            'notes' => $plan->notes,
            'creator' => $plan->user !== null ? [
                'id' => $plan->user->id,
                'name' => $plan->user->name,
                'role' => $plan->user->role,
            ] : null,
            'items' => $plan->items->map(fn (RestockPlanItem $item) => [
                'id' => $item->id,
                'ingredient_id' => $item->ingredient_id,
                'ingredient_name' => $item->ingredient->name ?? ('Bahan #'.$item->ingredient_id),
                'base_unit' => $item->ingredient->base_unit ?? 'pcs',
                'package_size' => (string) ($item->ingredient->package_size ?? '1'),
                'package_price' => (int) ($item->ingredient->package_price ?? 0),
                'current_stock' => (float) ($item->ingredient->current_stock ?? 0),
                'minimum_stock' => (float) ($item->ingredient->minimum_stock ?? 0),
                'abc_class' => $item->abc_class,
                'is_urgent' => (bool) $item->is_urgent,
                'urgency' => $item->urgency,
                'priority_score' => $item->priority_score,
                'qmin_packages' => $item->qmin_packages,
                'qtarget_packages' => $item->qtarget_packages,
                'recommended_packages' => $item->recommended_packages,
                'estimated_cost' => $item->estimated_cost,
                'actual_cost' => $item->actual_cost,
                'label' => $item->label,
                'purchased_packages' => $item->purchased_packages,
                'notes' => $item->notes,
            ])->values(),
        ];
    }
}
