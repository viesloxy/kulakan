<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'restock_plan_id', 'ingredient_id', 'urgency', 'is_urgent', 'abc_class',
    'priority_score', 'qmin_packages', 'qtarget_packages', 'recommended_packages',
    'estimated_cost', 'actual_cost', 'label', 'purchased_packages', 'notes',
])]
class RestockPlanItem extends Model
{
    protected function casts(): array
    {
        return [
            'urgency' => 'decimal:4',
            'priority_score' => 'decimal:4',
            'is_urgent' => 'boolean',
        ];
    }

    /** @return BelongsTo<RestockPlan, $this> */
    public function restockPlan(): BelongsTo
    {
        return $this->belongsTo(RestockPlan::class);
    }

    /** @return BelongsTo<Ingredient, $this> */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
