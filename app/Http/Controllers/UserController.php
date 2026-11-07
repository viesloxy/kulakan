<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola Pengguna (owner): satu UMKM dengan banyak akun (multi-owner & staff)
 * yang berbagi satu lingkungan data. Role per akun, owner tidak unik (matriks SAD §9).
 */
class UserController extends Controller
{
    public function index(): Response
    {
        $authId = request()->user()?->id;

        $users = User::withTrashed()
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->deleted_at === null,
                'is_self' => $authId !== null && $user->id === $authId,
                'created_at' => $user->created_at?->toDateString(),
            ])->values();

        return Inertia::render('pengguna', ['users' => $users]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'password' => $data['password'], // otomatis di-hash oleh cast User
            'email_verified_at' => now(), // akun dibuat owner, tanpa verifikasi email
        ]);

        return back()->with(
            'success',
            'Pengguna '.$data['name'].' dibuat sebagai '.$data['role'].'. Bagikan password secara langsung; pengguna dapat menggantinya di Pengaturan.',
        );
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            return back()->withErrors(['role' => 'Anda tidak dapat mengubah peran akun Anda sendiri.']);
        }

        $user->fill(['role' => $request->validated('role')])->save();

        return back()->with('success', 'Peran '.$user->name.' diubah menjadi '.$user->role.'.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            return back()->withErrors(['user' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.']);
        }

        if ($user->trashed()) {
            return back()->withErrors(['user' => 'Pengguna sudah dinonaktifkan sebelumnya.']);
        }

        $user->delete();

        return back()->with('success', 'Pengguna '.$user->name.' dinonaktifkan dan tidak bisa login lagi. Riwayat penjualannya tetap tersimpan.');
    }

    public function restore(int $userId): RedirectResponse
    {
        /** @var User $user */
        $user = User::withTrashed()->findOrFail($userId);

        $user->restore();

        return back()->with('success', 'Pengguna '.$user->name.' diaktifkan kembali dan bisa login lagi.');
    }
}
