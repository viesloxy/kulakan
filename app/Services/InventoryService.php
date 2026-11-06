<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\PriceHistory;
use App\Models\SalesItem;
use App\Models\SalesOrder;
use App\Models\StockMovement;
use App\Models\User;
use App\Support\Number;
use Illuminate\Support\Facades\DB;

/**
 * Recipe-to-Stock & inventory: stock-in (WAC), penyesuaian/waste, pemotongan BOM atomik (BL §3-§6).
 */
class InventoryService
{
    public function __construct(private readonly CostingService $costing) {}

    /**
     * Stock-in pembelian: tambah stok, hitung ulang WAC, catat ledger + riwayat harga (FR-005/006).
     *
     * @param  string  $quantityBase  kuantitas dalam satuan dasar (sudah dikonversi)
     * @param  string  $unitPrice  harga beli per satuan dasar
     */
    public function stockIn(
        Ingredient $ingredient,
        string $quantityBase,
        string $unitPrice,
        ?User $user = null,
        string $reason = 'purchase',
    ): StockMovement {
        return DB::transaction(function () use ($ingredient, $quantityBase, $unitPrice, $user, $reason) {
            $ingredient = Ingredient::whereKey($ingredient->id)->lockForUpdate()->firstOrFail();

            $quantityBase = Number::str($quantityBase);
            $unitPrice = Number::str($unitPrice);

            $oldQty = Number::str($ingredient->current_stock);
            $oldCost = Number::str($ingredient->cost_per_unit);
            $newWac = $this->costing->weightedAverageCost($oldQty, $oldCost, $quantityBase, $unitPrice);

            $ingredient->forceFill([
                'current_stock' => bcadd($oldQty, $quantityBase, 3),
                'cost_per_unit' => $newWac,
            ])->save();

            $movement = StockMovement::create([
                'ingredient_id' => $ingredient->id,
                'type' => 'purchase',
                'qty_change' => bcadd($quantityBase, '0', 3),
                'unit_price' => bcadd($unitPrice, '0', 4),
                'reason' => $reason,
                'user_id' => $user?->id,
            ]);

            PriceHistory::create([
                'ingredient_id' => $ingredient->id,
                'type' => 'purchase',
                'old_value' => $oldCost,
                'new_value' => $newWac,
                'reason' => $reason,
                'user_id' => $user?->id,
            ]);

            $this->costing->recalculateForIngredient($ingredient);

            return $movement;
        });
    }

    /**
     * Penyesuaian stok / waste (FR-007). Alasan wajib.
     *
     * @param  'waste'|'adjustment'  $type
     */
    public function adjust(
        Ingredient $ingredient,
        string $qtyChange,
        string $type,
        string $reason,
        ?User $user = null,
    ): StockMovement {
        return DB::transaction(function () use ($ingredient, $qtyChange, $type, $reason, $user) {
            $ingredient = Ingredient::whereKey($ingredient->id)->lockForUpdate()->firstOrFail();
            $qtyChange = Number::str($qtyChange);

            $ingredient->forceFill([
                'current_stock' => bcadd(Number::str($ingredient->current_stock), $qtyChange, 3),
            ])->save();

            return StockMovement::create([
                'ingredient_id' => $ingredient->id,
                'type' => $type,
                'qty_change' => bcadd($qtyChange, '0', 3),
                'reason' => $reason,
                'user_id' => $user?->id,
            ]);
        });
    }

    /**
     * Simpan pesanan: potong stok seluruh bahan sesuai BOM secara atomik (FR-013-017).
     *
     * @param  array<int, array{menu_id:int, quantity:int}>  $lines
     *
     * @throws InsufficientStockException bila ada bahan yang kurang
     */
    public function processOrder(
        array $lines,
        string $paymentMethod,
        ?string $idempotencyKey,
        User $user,
    ): SalesOrder {
        if ($idempotencyKey !== null) {
            $existing = SalesOrder::where('idempotency_key', $idempotencyKey)->first();
            if ($existing !== null) {
                return $existing->load('items');
            }
        }

        return DB::transaction(function () use ($lines, $paymentMethod, $idempotencyKey, $user) {
            $menuIds = array_map(fn ($line) => (int) $line['menu_id'], $lines);
            $menus = Menu::with('recipe.items')->whereIn('id', $menuIds)->get()->keyBy('id');

            /** @var array<int, numeric-string> $needs ingredient_id => kuantitas dibutuhkan */
            $needs = [];
            $orderLines = [];
            $total = 0;

            foreach ($lines as $line) {
                $menu = $menus[(int) $line['menu_id']] ?? null;
                $quantity = (int) $line['quantity'];

                if ($menu === null || ! $menu->is_active || $menu->recipe === null || $menu->recipe->items->isEmpty()) {
                    throw new \InvalidArgumentException('Menu tidak valid, tidak aktif, atau belum punya BOM (FR-012).');
                }

                $orderLines[] = ['menu' => $menu, 'quantity' => $quantity];
                $total += $menu->selling_price * $quantity;

                foreach ($menu->recipe->items as $bom) {
                    $perPortion = $this->costing->effectiveQty((string) $bom->quantity_needed, (string) $bom->waste_factor);
                    $needed = bcmul($perPortion, Number::str($quantity), 6);
                    $needs[$bom->ingredient_id] = bcadd($needs[$bom->ingredient_id] ?? '0', $needed, 6);
                }
            }

            // Kunci bahan urut id menaik untuk cegah deadlock (BR-031).
            ksort($needs);
            $ingredients = Ingredient::whereIn('id', array_keys($needs))
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $shortages = [];
            foreach ($needs as $ingredientId => $needed) {
                $ingredient = $ingredients[$ingredientId];
                $available = Number::str($ingredient->current_stock);

                if (bccomp($available, $needed, 6) < 0) {
                    $shortages[] = [
                        'ingredient_id' => $ingredientId,
                        'name' => $ingredient->name,
                        'needed' => bcadd($needed, '0', 3),
                        'available' => bcadd($available, '0', 3),
                        'shortage' => bcsub($needed, $available, 3),
                    ];
                }
            }

            if ($shortages !== []) {
                throw new InsufficientStockException($shortages);
            }

            $order = SalesOrder::create([
                'order_number' => $this->nextOrderNumber(),
                'user_id' => $user->id,
                'total_amount' => $total,
                'payment_method' => $paymentMethod,
                'status' => 'completed',
                'idempotency_key' => $idempotencyKey,
            ]);

            foreach ($orderLines as $orderLine) {
                $menu = $orderLine['menu'];
                $currentHpp = Number::str($menu->current_hpp);
                $hpp = bccomp($currentHpp, '0', 2) > 0 ? $currentHpp : $this->costing->menuHpp($menu);

                SalesItem::create([
                    'sales_order_id' => $order->id,
                    'menu_id' => $menu->id,
                    'quantity' => $orderLine['quantity'],
                    'unit_price' => $menu->selling_price,
                    'unit_hpp_at_sale' => $hpp,
                ]);
            }

            foreach ($needs as $ingredientId => $needed) {
                $ingredient = $ingredients[$ingredientId];
                $ingredient->forceFill([
                    'current_stock' => bcsub(Number::str($ingredient->current_stock), $needed, 3),
                ])->save();

                StockMovement::create([
                    'ingredient_id' => $ingredientId,
                    'type' => 'sale',
                    'qty_change' => bcmul($needed, '-1', 3),
                    'sales_order_id' => $order->id,
                ]);
            }

            return $order->load('items');
        });
    }

    private function nextOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $countToday = SalesOrder::whereDate('created_at', now()->toDateString())->count() + 1;

        return sprintf('ORD-%s-%04d', $date, $countToday);
    }
}
