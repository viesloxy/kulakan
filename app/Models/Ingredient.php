<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable([
    'name', 'base_unit', 'current_stock', 'minimum_stock', 'cost_per_unit',
    'last_quote_price', 'last_quote_at', 'lead_time_days', 'review_period_days',
    'package_size', 'package_price', 'moq_packages', 'is_active',
])]
class Ingredient extends Model
{
    protected function casts(): array
    {
        return [
            'current_stock' => 'decimal:3',
            'minimum_stock' => 'decimal:3',
            'cost_per_unit' => 'decimal:4',
            'last_quote_price' => 'decimal:4',
            'last_quote_at' => 'datetime',
            'package_size' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /** @return HasMany<PriceHistory, $this> */
    public function priceHistories(): HasMany
    {
        return $this->hasMany(PriceHistory::class);
    }

    /** @return HasMany<RecipeIngredient, $this> */
    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    /** @return HasMany<RestockPlanItem, $this> */
    public function restockPlanItems(): HasMany
    {
        return $this->hasMany(RestockPlanItem::class);
    }

    /** @return MorphMany<Alert, $this> */
    public function alerts(): MorphMany
    {
        return $this->morphMany(Alert::class, 'subject');
    }
}
