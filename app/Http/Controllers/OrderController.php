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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly CostingService $costing,
        private readonly InventoryService $inventory,
        private readonly AlertService $alerts,
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
                'image_url' => $m->image_path !== null
                    ? Storage::disk('public')->url($m->image_path)
                    : null,
                'selling_price' => $m->selling_price,
                'portions_available' => $this->costing->portionsAvailable($m),
            ])->values();

        return Inertia::render('pos', ['menus' => $menus]);
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
        }

        $this->alerts->syncAll();

        return back()->with('success', 'Pesanan '.$order->order_number.' tersimpan. Stok bahan terpotong otomatis.');
    }

    public function void(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        if ($salesOrder->status !== 'completed') {
            return back()->withErrors(['void' => 'Pesanan ini sudah dibatalkan.']);
        }

        $this->inventory->voidOrder($salesOrder, $request->user());
        $this->alerts->syncAll();

        return back()->with('success', 'Pesanan '.$salesOrder->order_number.' dibatalkan; stok dikembalikan.');
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
