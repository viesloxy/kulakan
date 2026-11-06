<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'cash_amount', 'total_cost', 'remaining_cash', 'status', 'purchased_at'])]
class RestockPlan extends Model
{
    protected function casts(): array
    {
        return [
            'purchased_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<RestockPlanItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(RestockPlanItem::class);
    }
}
