<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\RestockPlan;
use App\Models\SalesOrder;
use App\Models\StockMovement;
use App\Services\AlertService;
use App\Services\RestockService;
use App\Support\Number;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const DEFAULT_CASH = 500000;

    public function __construct(
        private readonly AlertService $alerts,
        private readonly RestockService $restock,
    ) {}

    public function index(Request $request): Response
    {
        $this->alerts->syncAll();

        $ingredients = Ingredient::where('is_active', true)->get();

        $inventoryValue = $ingredients->reduce(
            fn (string $carry, Ingredient $ingredient) => bcadd(
                $carry,
                bcmul(Number::str($ingredient->current_stock), Number::str($ingredient->cost_per_unit), 2),
                2,
            ),
            '0',
        );

        $lowStockCount = $ingredients->filter(
            fn (Ingredient $ingredient) => bccomp(
                Number::str($ingredient->current_stock),
                Number::str($ingredient->minimum_stock),
                3,
            ) < 0,
        )->count();

        $menus = Menu::all();
        $menuCounts = [
            'profitable' => $menus->where('status', 'profitable')->count(),
            'watchlist' => $menus->where('status', 'watchlist')->count(),
            'loss' => $menus->where('status', 'loss')->count(),
            'total' => $menus->count(),
        ];

        $today = now()->toDateString();
        $ordersToday = SalesOrder::whereDate('created_at', $today)->where('status', 'completed')->count();
        $salesToday = (int) SalesOrder::whereDate('created_at', $today)->where('status', 'completed')->sum('total_amount');
        $cashToday = (int) SalesOrder::whereDate('created_at', $today)->where('status', 'completed')->where('payment_method', 'cash')->sum('total_amount');
        $qrisToday = (int) SalesOrder::whereDate('created_at', $today)->where('status', 'completed')->where('payment_method', 'qris')->sum('total_amount');

        $activeAlerts = Alert::where('status', 'active')->count();

        $chart = [];
        for ($dayOffset = 6; $dayOffset >= 0; $dayOffset--) {
            $day = now()->subDays($dayOffset);
            $chart[] = [
                'date' => $day->toDateString(),
                'label' => $this->dayLabel((int) $day->dayOfWeek),
                'total' => (int) SalesOrder::whereDate('created_at', $day->toDateString())
                    ->where('status', 'completed')
                    ->sum('total_amount'),
            ];
        }

        $recentOrders = SalesOrder::with('items.menu')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (SalesOrder $order): array => $this->orderRow($order))
            ->values();

        $dailyReport = $this->dailyReport($request);

        [$cashBudget, $restock] = $this->restockSummary();

        return Inertia::render('dashboard', [
            'greeting_name' => $this->displayName($request->user()?->name),
            'inventory_value' => (int) $inventoryValue,
            'low_stock_count' => $lowStockCount,
            'menu_counts' => $menuCounts,
            'active_alerts_count' => $activeAlerts,
            'orders_today_count' => $ordersToday,
            'sales_today' => $salesToday,
            'wallets' => ['cash' => $cashToday, 'qris' => $qrisToday],
            'cash_budget' => $cashBudget,
            'restock' => $restock,
            'chart' => $chart,
            'recent_orders' => $recentOrders,
            'daily_report' => $dailyReport,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderRow(SalesOrder $order): array
    {
        $items = $order->items;
        $first = $items->first();
        $count = $items->count();

        $description = '-';
        if ($first !== null && $first->menu !== null) {
            $description = $first->menu->name.' x'.$first->quantity
                .($count > 1 ? ' +'.($count - 1).' lainnya' : '');
        }

        return [
            'id' => $order->order_number,
            'db_id' => $order->id,
            'description' => $description,
            'total' => (int) $order->total_amount,
            'status' => $order->status,
            'can_void' => $order->status === 'completed',
        ];
    }

    /**
     * Laporan harian penjualan & pembelian (FR-037): Σ pesanan selesai & stock-in pada tanggal.
     *
     * @return array<string, mixed>
     */
    private function dailyReport(Request $request): array
    {
        $reportDate = $request->string('report_date')->toString();
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $reportDate) !== 1) {
            $reportDate = now()->toDateString();
        }

        $orders = SalesOrder::with('items.menu')
            ->whereDate('created_at', $reportDate)
            ->orderByDesc('id')
            ->get();

        $completed = $orders->where('status', 'completed');

        $purchases = StockMovement::with('ingredient')
            ->where('type', 'purchase')
            ->whereDate('created_at', $reportDate)
            ->orderByDesc('id')
            ->get();

        $purchaseValue = $purchases->reduce(
            fn (string $carry, StockMovement $movement) => bcadd(
                $carry,
                bcmul(Number::str($movement->qty_change), Number::str($movement->unit_price ?? '0'), 2),
                2,
            ),
            '0',
        );

        return [
            'date' => $reportDate,
            'sales' => [
                'orders' => $completed->count(),
                'revenue' => (int) $completed->sum('total_amount'),
                'items' => (int) $completed->sum(fn (SalesOrder $order): int => (int) $order->items->sum('quantity')),
                'cash' => (int) $completed->where('payment_method', 'cash')->sum('total_amount'),
                'qris' => (int) $completed->where('payment_method', 'qris')->sum('total_amount'),
            ],
            'purchases' => [
                'count' => $purchases->count(),
                'total_value' => (int) $purchaseValue,
                'items' => $purchases->map(fn (StockMovement $movement): array => [
                    'ingredient' => $movement->ingredient->name,
                    'base_unit' => $movement->ingredient->base_unit,
                    'quantity' => bcadd(Number::str($movement->qty_change), '0', 3),
                    'unit_price' => bcadd(Number::str($movement->unit_price ?? '0'), '0', 4),
                    'total' => (int) bcmul(Number::str($movement->qty_change), Number::str($movement->unit_price ?? '0'), 0),
                    'reason' => $movement->reason,
                    'created_at' => $movement->created_at?->toIso8601String(),
                ])->values(),
            ],
            'orders' => $orders->map(fn (SalesOrder $order): array => $this->orderRow($order))->values(),
        ];
    }

    /**
     * @return array{0:int, 1:array<string, mixed>}
     */
    private function restockSummary(): array
    {
        $lastPlan = RestockPlan::orderByDesc('id')->first();

        if ($lastPlan !== null) {
            return [
                (int) $lastPlan->cash_amount,
                [
                    'total_cost' => (int) $lastPlan->total_cost,
                    'remaining_cash' => (int) $lastPlan->remaining_cash,
                    'cash_amount' => (int) $lastPlan->cash_amount,
                    'status' => $lastPlan->status,
                    'exists' => true,
                ],
            ];
        }

        $plan = $this->restock->planRestock(
            (string) self::DEFAULT_CASH,
            $this->restock->buildParams(7, 2, 3),
        );

        return [
            self::DEFAULT_CASH,
            [
                'total_cost' => $plan['total_cost'],
                'remaining_cash' => $plan['remaining_cash'],
                'cash_amount' => self::DEFAULT_CASH,
                'status' => 'preview',
                'exists' => false,
            ],
        ];
    }

    private function dayLabel(int $dayOfWeek): string
    {
        return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][$dayOfWeek] ?? '-';
    }

    private function displayName(?string $name): string
    {
        if ($name === null || trim($name) === '') {
            return 'Pemilik';
        }

        return trim(preg_replace('/\s*\(.*?\)\s*/', '', $name) ?? $name);
    }
}
