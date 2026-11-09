<?php

namespace App\Http\Middleware;

use App\Models\Alert;
use App\Support\AlertPresenter;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user()?->only(['id', 'name', 'email', 'role']),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'notifications' => $this->notifications($request),
        ];
    }

    /**
     * Ringkasan alert aktif untuk lonceng notifikasi di header.
     * Hanya untuk owner (Alert Center owner-only, matriks SAD §9); staff tidak
     * memiliki konteks alert sehingga tombol ikut disembunyikan di UI.
     *
     * @return array{count: int, items: list<array<string, mixed>>}|null
     */
    private function notifications(Request $request): ?array
    {
        $user = $request->user();

        if ($user === null || $user->role !== 'owner') {
            return null;
        }

        $active = Alert::where('status', 'active')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return [
            'count' => $active->count(),
            'items' => array_values(
                $active->take(4)
                    ->map(fn (Alert $alert): array => AlertPresenter::present($alert))
                    ->all()
            ),
        ];
    }
}
