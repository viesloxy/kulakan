<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Services\AlertService;
use App\Support\Number;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AlertController extends Controller
{
    public function __construct(private readonly AlertService $alerts) {}

    public function index(): Response
    {
        $this->alerts->syncAll();

        $active = Alert::where('status', 'active')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $counts = [
            'active' => $active->count(),
            'low_stock' => $active->where('type', 'low_stock')->count(),
            'margin_drop' => $active->where('type', 'margin_drop')->count(),
            'price_hike' => $active->where('type', 'price_hike')->count(),
        ];

        return Inertia::render('alerts', [
            'alerts' => $active->map(fn (Alert $alert) => $this->present($alert))->values(),
            'counts' => $counts,
        ]);
    }

    public function resolve(Alert $alert): RedirectResponse
    {
        $alert->forceFill([
            'status' => 'resolved',
            'resolved_at' => now(),
        ])->save();

        return back()->with('success', 'Alert ditandai selesai.');
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Alert $alert): array
    {
        $payload = is_array($alert->payload) ? $alert->payload : [];
        [$title, $description] = $this->describe($alert->type, $payload);

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
    private function describe(string $type, array $payload): array
    {
        $name = (string) ($payload['name'] ?? 'Bahan');

        return match ($type) {
            'low_stock' => [
                $name.' di bawah stok minimum',
                'Stok '.$this->qty($payload['current_stock'] ?? '0').' '.$this->unit($payload['base_unit'] ?? null)
                    .', minimum '.$this->qty($payload['minimum_stock'] ?? '0').' '.$this->unit($payload['base_unit'] ?? null)
                    .' (kurang '.$this->qty($payload['shortage'] ?? '0').' '.$this->unit($payload['base_unit'] ?? null).').'
                    .' Lead time '.((int) ($payload['lead_time_days'] ?? 0)).' hari.',
            ],
            'price_hike' => [
                'Harga '.$name.' naik '.$this->pct($payload['change_pct'] ?? '0').'%',
                'Harga terbaru Rp '.$this->money($payload['old_price'] ?? '0').' menjadi Rp '
                    .$this->money($payload['new_price'] ?? '0').' per '.$this->unit($payload['base_unit'] ?? null)
                    .'. Ambang alert 10%.',
            ],
            'margin_drop' => [
                'Margin '.$name.' turun ke '.$this->statusLabel($payload['new_status'] ?? null),
                'Margin '.$this->pct($payload['old_margin_pct'] ?? '0').'% menjadi '.$this->pct($payload['new_margin_pct'] ?? '0')
                    .'% setelah kenaikan harga bahan. HPP proyeksi Rp '.$this->money($payload['projected_hpp'] ?? '0').'.',
            ],
            default => [$name, ''],
        };
    }

    private function qty(mixed $value): string
    {
        return number_format((float) Number::str($value), 0, ',', '.');
    }

    private function money(mixed $value): string
    {
        return number_format((float) Number::str($value), 0, ',', '.');
    }

    private function pct(mixed $value): string
    {
        return number_format((float) Number::str($value), 2, ',', '.');
    }

    private function unit(mixed $unit): string
    {
        return match ((string) $unit) {
            'gram' => 'g',
            'ml' => 'ml',
            'pcs' => 'pcs',
            default => '',
        };
    }

    private function statusLabel(mixed $status): string
    {
        return match ((string) $status) {
            'profitable' => 'Profitable',
            'watchlist' => 'Watchlist',
            'loss' => 'Loss',
            default => '-',
        };
    }
}
