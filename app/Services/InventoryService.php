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
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
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

            $newStock = bcadd(Number::str($ingredient->current_stock), $qtyChange, 3);
            if (bccomp($newStock, '0', 3) < 0) {
                throw new \InvalidArgumentException('Stok bahan baku tidak boleh menjadi negatif.');
            }

            $ingredient->forceFill([
                'current_stock' => $newStock,
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

        $attempts = 0;
        while ($attempts < 3) {
            $attempts++;

            try {
                return DB::transaction(function () use ($lines, $paymentMethod, $idempotencyKey, $user) {
                    if ($idempotencyKey !== null) {
                        $existing = SalesOrder::where('idempotency_key', $idempotencyKey)->first();
                        if ($existing !== null) {
                            return $existing->load('items');
                        }
                    }

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

                        if (! $ingredient->is_active) {
                            throw new \InvalidArgumentException('Bahan baku "'.$ingredient->name.'" sedang dinonaktifkan.');
                        }

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
                        'status' => 'preparing',
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
            } catch (UniqueConstraintViolationException|QueryException $e) {
                // Proteksi SEC-05: Tangani benturan konkurensi idempotency key atau order_number
                if ($idempotencyKey !== null) {
                    $existing = SalesOrder::where('idempotency_key', $idempotencyKey)->first();
                    if ($existing !== null) {
                        return $existing->load('items');
                    }
                }

                if ($attempts >= 3) {
                    throw $e;
                }
            }
        }

        throw new \RuntimeException('Gagal memproses pesanan setelah beberapa percobaan.');
    }

    /**
     * Ubah status operasional pesanan: preparing -> ready -> completed.
     *
     * @param  'ready'|'completed'  $newStatus
     *
     * @throws \InvalidArgumentException bila transisi status tidak valid
     */
    public function updateStatus(SalesOrder $order, string $newStatus, ?User $user = null): SalesOrder
    {
        return DB::transaction(function () use ($order, $newStatus): SalesOrder {
            $order = SalesOrder::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($order->status === 'void') {
                throw new \InvalidArgumentException('Pesanan '.$order->order_number.' sudah dibatalkan (void).');
            }

            if ($order->status === $newStatus) {
                return $order;
            }

            $allowed = [
                'preparing' => ['ready', 'completed'],
                'ready' => ['completed'],
            ];

            if (! isset($allowed[$order->status]) || ! in_array($newStatus, $allowed[$order->status], true)) {
                throw new \InvalidArgumentException("Transisi status dari '{$order->status}' ke '{$newStatus}' tidak diizinkan.");
            }

            $order->forceFill(['status' => $newStatus])->save();

            return $order;
        });
    }

    /**
     * Void pesanan: kembalikan stok dari ledger konsumsi asli (BL §5.5, DEC-13).
     * Mendukung pemulihan stok fisik (restored) atau pencatatan limbah operasional (wasted).
     *
     * @param  string  $handling  'restored'|'wasted'
     *
     * @throws \InvalidArgumentException bila pesanan sudah dibatalkan atau opsi handling tidak valid
     */
    public function voidOrder(
        SalesOrder $order,
        string $handling = 'restored',
        ?string $reason = null,
        ?User $user = null,
    ): SalesOrder {
        return DB::transaction(function () use ($order, $handling, $reason, $user): SalesOrder {
            $order = SalesOrder::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($order->status === 'void') {
                throw new \InvalidArgumentException('Pesanan '.$order->order_number.' sudah dibatalkan.');
            }

            if (! in_array($handling, ['restored', 'wasted'], true)) {
                throw new \InvalidArgumentException('Opsi penanganan stok tidak valid: '.$handling);
            }

            // Konsumsi asli dibaca dari ledger (bukan dihitung ulang dari BOM terkini).
            $movements = StockMovement::where('sales_order_id', $order->id)
                ->where('type', 'sale')
                ->get();

            $ingredients = Ingredient::whereIn('id', $movements->pluck('ingredient_id')->unique()->sort()->values())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $reasonText = $reason !== null && trim($reason) !== '' ? trim($reason) : 'Tanpa alasan';

            foreach ($movements as $movement) {
                /** @var Ingredient $ingredient */
                $ingredient = $ingredients[$movement->ingredient_id];
                $consumed = bcmul(Number::str($movement->qty_change), '-1', 3);

                if ($handling === 'restored') {
                    // Pulihkan stok fisik ke rak
                    $ingredient->forceFill([
                        'current_stock' => bcadd(Number::str($ingredient->current_stock), $consumed, 3),
                    ])->save();

                    StockMovement::create([
                        'ingredient_id' => $ingredient->id,
                        'type' => 'sale_reversal',
                        'qty_change' => $consumed,
                        'reason' => 'void '.$order->order_number.': '.$reasonText,
                        'user_id' => $user?->id,
                        'sales_order_id' => $order->id,
                    ]);
                } else {
                    // Bahan terlanjur dibuat/terbuang:
                    // 1. Nihilkan konsumsi penjualan (agar tidak tercatat sebagai menu terjual)
                    StockMovement::create([
                        'ingredient_id' => $ingredient->id,
                        'type' => 'sale_reversal',
                        'qty_change' => $consumed,
                        'reason' => 'void waste reversal '.$order->order_number,
                        'user_id' => $user?->id,
                        'sales_order_id' => $order->id,
                    ]);

                    // 2. Catat sebagai limbah operasional (waste) dengan nilai qty negatif
                    StockMovement::create([
                        'ingredient_id' => $ingredient->id,
                        'type' => 'waste',
                        'qty_change' => bcmul($consumed, '-1', 3),
                        'reason' => 'Batal pesanan '.$order->order_number.': '.$reasonText,
                        'user_id' => $user?->id,
                        'sales_order_id' => $order->id,
                    ]);
                }
            }

            $order->forceFill([
                'status' => 'void',
                'void_reason' => $reasonText,
                'void_type' => $handling,
                'voided_at' => now(),
                'voided_by' => $user?->id,
            ])->save();

            return $order;
        });
    }

    private function nextOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $countToday = SalesOrder::whereDate('created_at', now()->toDateString())->count() + 1;

        // Proteksi SEC-05: Entropi acak 2-karakter heksadesimal + pengecekan keunikan (panjang 19 karakter <= varchar(20))
        do {
            $entropy = strtoupper(bin2hex(random_bytes(1)));
            $candidate = sprintf('ORD-%s-%04d%s', $date, $countToday % 10000, $entropy);
            $countToday++;
        } while (SalesOrder::where('order_number', $candidate)->exists());

        return $candidate;
    }
}
