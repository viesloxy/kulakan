<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\RestockPlan;
use App\Models\SalesOrder;
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
        $ordersToday = SalesOrder::whereDate('created_at', $today)->count();
        $salesToday = (int) SalesOrder::whereDate('created_at', $today)->sum('total_amount');
        $cashToday = (int) SalesOrder::whereDate('created_at', $today)->where('payment_method', 'cash')->sum('total_amount');
        $qrisToday = (int) SalesOrder::whereDate('created_at', $today)->where('payment_method', 'qris')->sum('total_amount');

        $activeAlerts = Alert::where('status', 'active')->count();

        $chart = [];
        for ($dayOffset = 6; $dayOffset >= 0; $dayOffset--) {
            $day = now()->subDays($dayOffset);
            $chart[] = [
                'date' => $day->toDateString(),
                'label' => $this->dayLabel((int) $day->dayOfWeek),
                'total' => (int) SalesOrder::whereDate('created_at', $day->toDateString())->sum('total_amount'),
            ];
        }

        $recentOrders = SalesOrder::with('items.menu')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function (SalesOrder $order): array {
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
                    'description' => $description,
                    'total' => (int) $order->total_amount,
                    'status' => $order->status,
                ];
            })->values();

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
        ]);
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
