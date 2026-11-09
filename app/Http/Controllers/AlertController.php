<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Services\AlertService;
use App\Support\AlertPresenter;
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
            'alerts' => $active->map(fn (Alert $alert) => AlertPresenter::present($alert))->values(),
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
}
