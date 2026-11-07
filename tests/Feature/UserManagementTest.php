<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('owner melihat daftar pengguna dengan peran dan status', function () {
    $this->actingAs($this->owner)
        ->get('/pengguna')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pengguna')
            ->has('users', 2));
});

it('staff tidak boleh mengakses kelola pengguna (FR-002, SAD §9)', function () {
    $this->actingAs($this->staff)->get('/pengguna')->assertForbidden();
});

it('owner dapat menambah pengguna staff yang langsung aktif dan terverifikasi', function () {
    $this->actingAs($this->owner)
        ->post('/pengguna', [
            'name' => 'Dimas Dapur',
            'email' => 'dimas@kulakan.com',
            'role' => 'staff',
            'password' => 'rahasia123',
        ])->assertRedirect();

    $user = User::where('email', 'dimas@kulakan.com')->firstOrFail();

    expect($user->role)->toBe('staff')
        ->and($user->email_verified_at)->not->toBeNull()
        ->and(Hash::check('rahasia123', $user->password))->toBeTrue();
});

it('owner dapat menambah owner kedua (multi-owner per UMKM)', function () {
    $this->actingAs($this->owner)
        ->post('/pengguna', [
            'name' => 'Rahmat (Pemilik 2)',
            'email' => 'owner2@kulakan.com',
            'role' => 'owner',
            'password' => 'rahasia123',
        ])->assertRedirect();

    expect(User::where('email', 'owner2@kulakan.com')->firstOrFail()->role)->toBe('owner');
});

it('email duplikat ditolak', function () {
    $this->actingAs($this->owner)
        ->post('/pengguna', [
            'name' => 'Duplikat',
            'email' => 'staff@kulakan.com',
            'role' => 'staff',
            'password' => 'rahasia123',
        ])->assertSessionHasErrors('email');
});

it('owner dapat mengubah peran staff menjadi owner', function () {
    $this->actingAs($this->owner)
        ->put("/pengguna/{$this->staff->id}", ['role' => 'owner'])
        ->assertRedirect();

    expect($this->staff->fresh()->role)->toBe('owner');
});

it('owner tidak dapat mengubah peran akunnya sendiri', function () {
    $this->actingAs($this->owner)
        ->put("/pengguna/{$this->owner->id}", ['role' => 'staff'])
        ->assertRedirect();

    expect($this->owner->fresh()->role)->toBe('owner');
});

it('owner dapat menonaktifkan pengguna lewat soft delete', function () {
    $this->actingAs($this->owner)
        ->delete("/pengguna/{$this->staff->id}")
        ->assertRedirect();

    expect($this->staff->fresh()->deleted_at)->not->toBeNull();
});

it('pengguna yang dinonaktifkan tidak bisa login (soft delete dikecualikan dari auth)', function () {
    $this->staff->delete();

    // Tanpa sesi aktif: middleware guest hanya dilewati pengguna tamu.
    $this->post('/login', [
        'email' => 'staff@kulakan.com',
        'password' => 'password',
    ])->assertSessionHasErrors('email');
});

it('owner dapat mengaktifkan kembali pengguna yang dinonaktifkan', function () {
    $this->staff->delete();

    $this->actingAs($this->owner)
        ->post("/pengguna/{$this->staff->id}/restore")
        ->assertRedirect();

    expect($this->staff->fresh()->deleted_at)->toBeNull();
});

it('owner tidak dapat menonaktifkan akunnya sendiri', function () {
    $this->actingAs($this->owner)
        ->delete("/pengguna/{$this->owner->id}")
        ->assertRedirect();

    expect($this->owner->fresh()->deleted_at)->toBeNull();
});

it('pengguna yang dinonaktifkan tampil berstatus nonaktif di daftar', function () {
    $this->staff->delete();

    $this->actingAs($this->owner)->get('/pengguna')->assertInertia(
        fn (Assert $page) => $page
            ->component('pengguna')
            ->has('users', 2)
            ->where('users.1.is_active', false)
    );
});
