<?php

namespace App\Support;

use App\Models\Alert;

/**
 * Presenter alert (title/description) agar konsisten antara halaman Alert Center
 * dan ringkasan notifikasi di header (shared props Inertia).
 */
class AlertPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function present(Alert $alert): array
    {
        $payload = is_array($alert->payload) ? $alert->payload : [];
        [$title, $description] = self::describe($alert->type, $payload);

        return [
            'id' => $alert->id,
            'type' => $alert->type,
            'subject_type' => $alert->subject_type,
            'subject_id' => $alert->subject_id,
            'status' => $alert->status,
            'title' => $title,
            'description' => $description,
            'payload' => $payload,
            'created_at' => $alert->created_at?->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{0:string, 1:string}
     */
    private static function describe(string $type, array $payload): array
    {
        $name = (string) ($payload['name'] ?? 'Bahan');

        return match ($type) {
            'low_stock' => [
                $name.' di bawah stok minimum',
                'Stok '.self::qty($payload['current_stock'] ?? '0').' '.self::unit($payload['base_unit'] ?? null)
                    .', minimum '.self::qty($payload['minimum_stock'] ?? '0').' '.self::unit($payload['base_unit'] ?? null)
                    .' (kurang '.self::qty($payload['shortage'] ?? '0').' '.self::unit($payload['base_unit'] ?? null).').'
                    .' Lead time '.((int) ($payload['lead_time_days'] ?? 0)).' hari.',
            ],
            'price_hike' => [
                'Harga '.$name.' naik '.self::pct($payload['change_pct'] ?? '0').'%',
                'Harga terbaru Rp '.self::money($payload['old_price'] ?? '0').' menjadi Rp '
                    .self::money($payload['new_price'] ?? '0').' per '.self::unit($payload['base_unit'] ?? null)
                    .'. Ambang alert 10%.',
            ],
            'margin_drop' => [
                'Margin '.$name.' turun ke '.self::statusLabel($payload['new_status'] ?? null),
                'Margin '.self::pct($payload['old_margin_pct'] ?? '0').'% menjadi '.self::pct($payload['new_margin_pct'] ?? '0')
                    .'% setelah kenaikan harga bahan. HPP proyeksi Rp '.self::money($payload['projected_hpp'] ?? '0').'.',
            ],
            default => [$name, ''],
        };
    }

    private static function qty(mixed $value): string
    {
        return number_format((float) Number::str($value), 0, ',', '.');
    }

    private static function money(mixed $value): string
    {
        return number_format((float) Number::str($value), 0, ',', '.');
    }

    private static function pct(mixed $value): string
    {
        return number_format((float) Number::str($value), 2, ',', '.');
    }

    private static function unit(mixed $unit): string
    {
        return match ((string) $unit) {
            'gram' => 'g',
            'ml' => 'ml',
            'pcs' => 'pcs',
            default => '',
        };
    }

    private static function statusLabel(mixed $status): string
    {
        return match ((string) $status) {
            'profitable' => 'Profitable',
            'watchlist' => 'Watchlist',
            'loss' => 'Loss',
            default => '-',
        };
    }
}
