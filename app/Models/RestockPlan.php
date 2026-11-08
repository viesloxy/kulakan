<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $created_at
 * @property Carbon|null $approved_at
 * @property Carbon|null $ordered_at
 * @property Carbon|null $purchased_at
 * @property Carbon|null $cancelled_at
 */
#[Fillable([
    'user_id', 'cash_amount', 'total_cost', 'actual_cost', 'remaining_cash',
    'status', 'approved_at', 'ordered_at', 'purchased_at', 'cancelled_at',
    'cancellation_reason', 'notes',
])]
class RestockPlan extends Model
{
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'approved_at' => 'datetime',
            'ordered_at' => 'datetime',
            'purchased_at' => 'datetime',
            'cancelled_at' => 'datetime',
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
