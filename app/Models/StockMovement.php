<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Ledger stok append-only (INV-02). Tidak punya updated_at.
 */
#[Fillable([
    'ingredient_id', 'type', 'qty_change', 'unit_price', 'reason',
    'user_id', 'sales_order_id', 'restock_plan_item_id',
])]
class StockMovement extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'qty_change' => 'decimal:3',
            'unit_price' => 'decimal:4',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Ingredient, $this> */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<SalesOrder, $this> */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /** @return BelongsTo<RestockPlanItem, $this> */
    public function restockPlanItem(): BelongsTo
    {
        return $this->belongsTo(RestockPlanItem::class);
    }
}
