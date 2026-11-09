<?php

namespace App\Http\Controllers;

use App\Exceptions\InsufficientStockException;
use App\Http\Requests\Pos\StoreOrderRequest;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\SalesOrder;
use App\Services\AlertService;
use App\Services\CostingService;
use App\Services\InventoryService;
use App\Services\QrisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly CostingService $costing,
        private readonly InventoryService $inventory,
        private readonly AlertService $alerts,
        private readonly QrisService $qris,
    ) {}

    public function index(): Response
    {
        $menus = Menu::with('recipe.items.ingredient')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->filter(fn (Menu $m) => $m->recipe !== null && $m->recipe->items->isNotEmpty())
            ->map(fn (Menu $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'category' => $m->category ?? 'Kopi',
                'image_url' => $m->image_url,
                'selling_price' => $m->selling_price,
                'portions_available' => $this->costing->portionsAvailable($m),
            ])->values();

        $staticQris = $this->qris->getStoreDefaultStaticQris();
        $merchantInfo = $this->qris->extractMerchant($staticQris);

        return Inertia::render('pos', [
            'menus' => $menus,
            'active_queue_count' => SalesOrder::whereIn('status', ['preparing', 'ready'])->count(),
            'merchant_qris' => [
                'merchant_name' => $merchantInfo['merchant_name'],
                'merchant_city' => $merchantInfo['merchant_city'],
                'static_payload' => $staticQris,
            ],
        ]);
    }

    public function checkout(): Response
    {
        $staticQris = $this->qris->getStoreDefaultStaticQris();
        $merchantInfo = $this->qris->extractMerchant($staticQris);

        return Inertia::render('pos-checkout', [
            'merchant_qris' => [
                'merchant_name' => $merchantInfo['merchant_name'],
                'merchant_city' => $merchantInfo['merchant_city'],
                'nmid' => $merchantInfo['nmid'],
                'static_payload' => $staticQris,
            ],
        ]);
    }

    public function qrisPayload(Request $request): JsonResponse
    {
        $amount = (float) $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'invoice_id' => ['nullable', 'string', 'max:50'],
        ])['amount'];

        $invoiceId = $request->string('invoice_id')->trim()->toString();
        $invoiceId = $invoiceId !== '' ? $invoiceId : null;

        $staticQris = $this->qris->getStoreDefaultStaticQris();
        $dynamicPayload = $this->qris->convertToDynamic($staticQris, $amount, $invoiceId);
        $merchantInfo = $this->qris->extractMerchant($dynamicPayload);

        return response()->json([
            'qris_payload' => $dynamicPayload,
            'merchant_name' => $merchantInfo['merchant_name'],
            'merchant_city' => $merchantInfo['merchant_city'],
            'nmid' => $merchantInfo['nmid'],
            'amount' => $amount,
            'invoice_id' => $merchantInfo['invoice_id'],
        ]);
    }

    public function history(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();
        $payment = $request->string('payment')->toString();
        $period = $request->string('period')->toString();
        $startDate = $request->string('start_date')->toString();
        $endDate = $request->string('end_date')->toString();

        if (! in_array($status, ['preparing', 'ready', 'completed', 'void'], true)) {
            $status = 'all';
        }
        if (! in_array($payment, ['cash', 'qris'], true)) {
            $payment = 'all';
        }
        if (! in_array($period, ['today', 'yesterday', '7d', '30d', 'custom'], true)) {
            $period = 'all';
        }

        $query = SalesOrder::with(['items.menu', 'user:id,name,role', 'voidedBy:id,name']);

        // Filter period / date
        if ($period === 'today') {
            $query->whereDate('created_at', now()->toDateString());
        } elseif ($period === 'yesterday') {
            $query->whereDate('created_at', now()->subDay()->toDateString());
        } elseif ($period === '7d') {
            $query->where('created_at', '>=', now()->subDays(7)->startOfDay());
        } elseif ($period === '30d') {
            $query->where('created_at', '>=', now()->subDays(30)->startOfDay());
        } elseif ($period === 'custom' && $startDate !== '' && $endDate !== '') {
            $query->whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate);
        }

        // Filter search (order_number or menu name)
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('items.menu', function ($mq) use ($search) {
                        $mq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter status
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Filter payment
        if ($payment !== 'all') {
            $query->where('payment_method', $payment);
        }

        // Summary calculations
        $summaryQuery = clone $query;
        $totalOrders = (int) $summaryQuery->count();
        $activeOrders = (clone $summaryQuery)->where('status', '!=', 'void');
        $totalRevenue = (int) (clone $activeOrders)->sum('total_amount');
        $cashRevenue = (int) (clone $activeOrders)->where('payment_method', 'cash')->sum('total_amount');
        $qrisRevenue = (int) (clone $activeOrders)->where('payment_method', 'qris')->sum('total_amount');
        $preparingCount = (int) (clone $summaryQuery)->where('status', 'preparing')->count();
        $readyCount = (int) (clone $summaryQuery)->where('status', 'ready')->count();
        $completedCount = (int) (clone $summaryQuery)->where('status', 'completed')->count();
        $voidCount = (int) (clone $summaryQuery)->where('status', 'void')->count();

        $isOwner = $request->user()?->role === 'owner';
        $paginated = $query->latest('created_at')->latest('id')->paginate(10)->withQueryString();

        $paginated->through(function (SalesOrder $order) use ($isOwner) {
            $items = $order->items;
            $first = $items->first();
            $count = $items->count();

            $description = '-';
            if ($first !== null && $first->menu !== null) {
                $description = $first->menu->name.' x'.$first->quantity
                    .($count > 1 ? ' +'.($count - 1).' lainnya' : '');
            }

            $itemsData = $items->map(function ($item) use ($isOwner) {
                $unitHpp = (float) $item->unit_hpp_at_sale;
                $qty = (int) $item->quantity;
                $unitPrice = (int) $item->unit_price;

                return [
                    'id' => $item->id,
                    'menu_id' => $item->menu_id,
                    'menu_name' => $item->menu->name ?? 'Menu',
                    'menu_category' => $item->menu->category ?? 'Lainnya',
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'subtotal' => $qty * $unitPrice,
                    'unit_hpp' => $isOwner ? $unitHpp : null,
                    'subtotal_hpp' => $isOwner ? ($qty * $unitHpp) : null,
                ];
            })->values()->all();

            $totalHpp = $isOwner
                ? (float) $items->sum(fn ($i) => (int) $i->quantity * (float) $i->unit_hpp_at_sale)
                : 0.0;
            $grossProfit = $isOwner ? ((int) $order->total_amount - $totalHpp) : 0.0;
            $marginPct = ($isOwner && (int) $order->total_amount > 0)
                ? round(($grossProfit / (int) $order->total_amount) * 100, 1)
                : 0.0;

            $voidedAt = $order->voided_at !== null ? Carbon::parse($order->voided_at) : null;

            return [
                'id' => $order->order_number,
                'db_id' => $order->id,
                'created_at' => $order->created_at?->format('Y-m-d H:i') ?? '-',
                'created_at_human' => $order->created_at?->diffForHumans() ?? '-',
                'cashier' => $order->user->name ?? 'Staf',
                'cashier_role' => $order->user->role ?? 'staff',
                'total_amount' => (int) $order->total_amount,
                'payment_method' => $order->payment_method,
                'status' => $order->status,
                'description' => $description,
                'items_count' => (int) $items->sum('quantity'),
                'can_mark_ready' => $order->status === 'preparing',
                'can_mark_completed' => in_array($order->status, ['preparing', 'ready'], true),
                'can_void' => $isOwner && $order->status !== 'void',
                'void_reason' => $order->void_reason,
                'void_type' => $order->void_type,
                'voided_at' => $voidedAt?->format('Y-m-d H:i'),
                'voided_at_human' => $voidedAt?->diffForHumans(),
                'voided_by_name' => $order->voidedBy?->name,
                'items' => $itemsData,
                'total_hpp' => $totalHpp,
                'gross_profit' => $grossProfit,
                'margin_pct' => $marginPct,
            ];
        });

        return Inertia::render('orders', [
            'orders' => $paginated,
            'summary' => [
                'total_orders' => $totalOrders,
                'active_orders' => $totalOrders - $voidCount,
                'preparing_count' => $preparingCount,
                'ready_count' => $readyCount,
                'completed_count' => $completedCount,
                'void_count' => $voidCount,
                'total_revenue' => $totalRevenue,
                'cash_revenue' => $cashRevenue,
                'qris_revenue' => $qrisRevenue,
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'payment' => $payment,
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'is_owner' => $isOwner,
        ]);
    }

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $lines = [];
        foreach ((array) $request->validated('lines') as $line) {
            $line = (array) $line;
            $lines[] = [
                'menu_id' => (int) ($line['menu_id'] ?? 0),
                'quantity' => (int) ($line['quantity'] ?? 0),
            ];
        }

        $idempotencyKey = $request->validated('idempotency_key');
        $idempotencyKey = is_string($idempotencyKey) && $idempotencyKey !== '' ? $idempotencyKey : null;

        try {
            $order = $this->inventory->processOrder(
                $lines,
                (string) $request->validated('payment_method'),
                $idempotencyKey,
                $request->user(),
            );
        } catch (InsufficientStockException $e) {
            $detail = collect($e->shortages)
                ->map(fn (array $s) => $s['name'].' kurang '.$s['shortage'].' '.$this->unitFor($s['ingredient_id']))
                ->implode(', ');

            return back()->withErrors(['order' => 'Stok tidak cukup: '.$detail.'. Pesanan tidak disimpan.']);
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['order' => $e->getMessage()]);
        }

        $this->alerts->syncAll();

        $cashReceived = $request->integer('cash_received');
        $effectiveCashReceived = $cashReceived > 0 ? $cashReceived : (int) $order->total_amount;
        $change = max(0, $effectiveCashReceived - (int) $order->total_amount);

        $createdOrder = [
            'id' => $order->order_number,
            'db_id' => $order->id,
            'total_amount' => (int) $order->total_amount,
            'payment_method' => $order->payment_method,
            'cash_received' => $effectiveCashReceived,
            'change' => $change,
            'items_count' => (int) $order->items->sum('quantity'),
            'created_at' => $order->created_at?->format('Y-m-d H:i') ?? '-',
            'customer_name' => $request->string('customer_name')->trim()->toString(),
        ];

        return redirect()
            ->route('pos')
            ->with('success', 'Pesanan '.$order->order_number.' tersimpan. Stok bahan terpotong otomatis.')
            ->with('created_order', $createdOrder);
    }

    public function updateStatus(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:ready,completed'],
        ]);

        /** @var 'ready'|'completed' $newStatus */
        $newStatus = (string) $validated['status'];

        try {
            $this->inventory->updateStatus($salesOrder, $newStatus, $request->user());
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        $label = $newStatus === 'ready' ? 'Siap Diambil' : 'Selesai';

        return back()->with('success', "Pesanan {$salesOrder->order_number} ditandai sebagai {$label}.");
    }

    public function void(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        if ($request->user()?->role !== 'owner') {
            abort(403, 'Hanya Owner yang dapat membatalkan (void) pesanan.');
        }

        if ($salesOrder->status === 'void') {
            return back()->withErrors(['void' => 'Pesanan ini sudah dibatalkan sebelumnya.']);
        }

        $validated = $request->validate([
            'handling' => ['nullable', 'string', 'in:restored,wasted'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        /** @var 'restored'|'wasted' $handling */
        $handling = isset($validated['handling']) && $validated['handling'] === 'wasted' ? 'wasted' : 'restored';
        $reason = isset($validated['reason']) && is_string($validated['reason']) && trim($validated['reason']) !== ''
            ? trim($validated['reason'])
            : 'Pembatalan kasir';

        try {
            $this->inventory->voidOrder($salesOrder, $handling, $reason, $request->user());
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['void' => $e->getMessage()]);
        }

        $this->alerts->syncAll();

        $msg = $handling === 'wasted'
            ? "Pesanan {$salesOrder->order_number} dibatalkan; bahan terpakai dicatat sebagai limbah/waste operasional."
            : "Pesanan {$salesOrder->order_number} dibatalkan; stok bahan baku dikembalikan ke rak.";

        return back()->with('success', $msg);
    }

    public function print(SalesOrder $salesOrder, Request $request): View
    {
        $salesOrder->load(['items.menu', 'user:id,name,role']);

        $isOwner = $request->user()?->role === 'owner';
        $items = $salesOrder->items;
        $totalItemsCount = (int) $items->sum('quantity');

        $totalHpp = $isOwner
            ? (float) $items->sum(fn ($i) => (int) $i->quantity * (float) $i->unit_hpp_at_sale)
            : 0.0;
        $grossProfit = $isOwner ? ((int) $salesOrder->total_amount - $totalHpp) : 0.0;
        $marginPct = ($isOwner && (int) $salesOrder->total_amount > 0)
            ? round(($grossProfit / (int) $salesOrder->total_amount) * 100, 1)
            : 0.0;

        return view('receipt', [
            'order' => $salesOrder,
            'items' => $items,
            'totalItemsCount' => $totalItemsCount,
            'isOwner' => $isOwner,
            'totalHpp' => $totalHpp,
            'grossProfit' => $grossProfit,
            'marginPct' => $marginPct,
        ]);
    }

    private function unitFor(int $ingredientId): string
    {
        $units = [
            'gram' => 'g', 'ml' => 'ml', 'pcs' => 'pcs',
        ];

        $unit = Ingredient::whereKey($ingredientId)->value('base_unit');

        return $units[(string) $unit] ?? '';
    }
}
