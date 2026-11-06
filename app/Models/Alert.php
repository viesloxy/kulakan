<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property string $type
 * @property string $subject_type
 * @property int $subject_id
 * @property string $status
 * @property array<string, mixed>|null $payload
 */
#[Fillable(['type', 'subject_type', 'subject_id', 'status', 'payload', 'resolved_at'])]
class Alert extends Model
{
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'resolved_at' => 'datetime',
        ];
    }

    /** @return MorphTo<Model, $this> */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}
