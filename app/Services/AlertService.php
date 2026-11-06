<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\PriceHistory;
use App\Support\Number;
use Illuminate\Database\Eloquent\Model;

/**
 * Aturan Alert (BL §9): stok rendah (AL-01), margin turun (AL-02), harga bahan naik (AL-03).
 *
 * Rekonsiliasi bersifat transisi (BR-051): alert di-*raise* hanya bila sebelumnya belum ada
 * baris untuk subjek tersebut, di-reset otomatis saat kondisi tidak lagi terpenuhi, dan alert
 * yang sudah di-resolve manual tidak dipicu ulang selama kondisinya bertahan.
 */
class AlertService
{
    /** Ambang kenaikan harga bahan (DEC-11). */
    public const PRICE_HIKE_THRESHOLD = '10';

    /**
     * Rekonsiliasi seluruh alert dengan kondisi data terkini.
     *
     * @return int jumlah alert aktif setelah rekonsiliasi
     */
    public function syncAll(): int
    {
        $this->syncLowStock();
        $this->syncPriceHike();
        $this->syncMarginDrop();

        return Alert::where('status', 'active')->count();
    }

    private function syncLowStock(): void
    {
        foreach (Ingredient::where('is_active', true)->get() as $ingredient) {
            $stock = Number::str($ingredient->current_stock);
            $minimum = Number::str($ingredient->minimum_stock);
            $isLow = bccomp($stock, $minimum, 3) < 0;

            $this->evaluate(
                'low_stock',
                $ingredient,
                $isLow,
                [
                    'name' => $ingredient->name,
                    'base_unit' => $ingredient->base_unit,
                    'current_stock' => bcadd($stock, '0', 3),
                    'minimum_stock' => bcadd($minimum, '0', 3),
                    'shortage' => bcsub($minimum, $stock, 3),
                    'lead_time_days' => $ingredient->lead_time_days,
                ],
            );
        }
    }

    private function syncPriceHike(): void
    {
        $histories = PriceHistory::whereIn('type', ['purchase', 'quote'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->unique('ingredient_id');

        foreach ($histories as $history) {
            $ingredient = Ingredient::find($history->ingredient_id);
            if ($ingredient === null) {
                continue;
            }

            $old = Number::str($history->old_value ?? '0');
            $new = Number::str($history->new_value);

            $changePct = bccomp($old, '0', 8) > 0
                ? bcmul(bcdiv(bcsub($new, $old, 8), $old, 8), '100', 2)
                : '0.00';

            $this->evaluate(
                'price_hike',
                $ingredient,
                bccomp($changePct, self::PRICE_HIKE_THRESHOLD, 2) > 0,
                [
                    'name' => $ingredient->name,
                    'base_unit' => $ingredient->base_unit,
                    'old_price' => bcadd($old, '0', 4),
                    'new_price' => bcadd($new, '0', 4),
                    'change_pct' => $changePct,
                ],
            );
        }
    }

    private function syncMarginDrop(): void
    {
        foreach (Menu::all() as $menu) {
            $status = (string) $menu->status;
            $projected = $menu->projected_status;

            $isDrop = $projected !== null && $this->rank($projected) > $this->rank($status);

            $this->evaluate(
                'margin_drop',
                $menu,
                $isDrop,
                [
                    'name' => $menu->name,
                    'old_status' => $status,
                    'new_status' => $projected,
                    'old_margin_pct' => bcadd(Number::str($menu->margin_pct), '0', 2),
                    'new_margin_pct' => bcadd(Number::str($menu->projected_margin_pct ?? '0'), '0', 2),
                    'projected_hpp' => bcadd(Number::str($menu->projected_hpp ?? '0'), '0', 2),
                ],
            );
        }
    }

    /**
     * Raise/reset satu alert secara transisi.
     *
     * @param  array<string, mixed>  $payload
     */
    private function evaluate(string $type, Model $subject, bool $condition, array $payload): void
    {
        /** @var Alert|null $existing */
        $existing = Alert::where('type', $type)
            ->where('subject_type', $subject->getMorphClass())
            ->where('subject_id', $subject->getKey())
            ->first();

        if ($condition) {
            if ($existing === null) {
                Alert::create([
                    'type' => $type,
                    'subject_type' => $subject->getMorphClass(),
                    'subject_id' => $subject->getKey(),
                    'status' => 'active',
                    'payload' => $payload,
                ]);

                return;
            }

            if ($existing->status === 'active') {
                $existing->forceFill(['payload' => $payload])->save();
            }

            return;
        }

        if ($existing !== null && $existing->status === 'active') {
            $existing->forceFill(['status' => 'resolved', 'resolved_at' => now()])->save();
        }
    }

    private function rank(?string $status): int
    {
        return match ($status) {
            'profitable' => 0,
            'watchlist' => 1,
            'loss' => 2,
            default => -1,
        };
    }
}
