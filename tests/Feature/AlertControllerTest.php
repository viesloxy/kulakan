<?php

use App\Models\Alert;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('menampilkan alert aktif dari kondisi data terkini (BL §9)', function () {
    $this->actingAs($this->owner)
        ->get('/alert')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('alerts')
            ->has('alerts', 4)
            ->where('counts.active', 4)
            ->where('counts.low_stock', 2)
            ->where('counts.margin_drop', 1)
            ->where('counts.price_hike', 1));
});

it('menyusun judul alert margin dan harga dari payload', function () {
    $this->actingAs($this->owner)->get('/alert');

    $margin = Alert::where('type', 'margin_drop')->firstOrFail();
    $price = Alert::where('type', 'price_hike')->firstOrFail();

    expect($margin->payload['old_status'])->toBe('profitable')
        ->and($margin->payload['new_status'])->toBe('watchlist')
        ->and($price->payload['change_pct'])->toBe('20.00');
});

it('resolve manual tidak dipicu ulang selama kondisi bertahan (BR-051)', function () {
    $this->actingAs($this->owner)->get('/alert')->assertInertia(fn (Assert $page) => $page->has('alerts', 4));

    $alert = Alert::where('type', 'margin_drop')->firstOrFail();
    $this->actingAs($this->owner)->post("/alert/{$alert->id}/resolve")->assertRedirect();

    expect($alert->fresh()->status)->toBe('resolved');

    // Muat ulang: alert tetap resolved, tidak dibuat ulang.
    $this->actingAs($this->owner)
        ->get('/alert')
        ->assertInertia(fn (Assert $page) => $page
            ->has('alerts', 3)
            ->where('counts.active', 3));
});

it('staff tidak boleh mengakses alert (owner-only)', function () {
    $this->actingAs($this->staff)->get('/alert')->assertForbidden();
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/alert')->assertRedirect('/login');
});
