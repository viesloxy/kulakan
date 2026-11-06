<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable([
    'name', 'category', 'selling_price', 'overhead',
    'current_hpp', 'margin_pct', 'status',
    'projected_hpp', 'projected_margin_pct', 'projected_status', 'is_active',
])]
class Menu extends Model
{
    protected function casts(): array
    {
        return [
            'current_hpp' => 'decimal:2',
            'margin_pct' => 'decimal:2',
            'projected_hpp' => 'decimal:2',
            'projected_margin_pct' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasOne<Recipe, $this> */
    public function recipe(): HasOne
    {
        return $this->hasOne(Recipe::class);
    }

    /** @return HasMany<SalesItem, $this> */
    public function salesItems(): HasMany
    {
        return $this->hasMany(SalesItem::class);
    }

    /** @return MorphMany<Alert, $this> */
    public function alerts(): MorphMany
    {
        return $this->morphMany(Alert::class, 'subject');
    }
}
