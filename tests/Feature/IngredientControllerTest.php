<?php

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('menampilkan daftar bahan dari database', function () {
    $this->actingAs($this->owner)
        ->get('/bahan-baku')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('ingredients')
            ->has('ingredients', 10)
            ->has('meta.inventory_value')
            ->has('meta.low_stock_count'));
});

it('staff boleh melihat tetapi tidak boleh menambah bahan (FR-002)', function () {
    $this->actingAs($this->staff)->get('/bahan-baku')->assertOk();

    $this->actingAs($this->staff)
        ->post('/bahan-baku', ['name' => 'X', 'base_unit' => 'gram'])
        ->assertForbidden();
});

it('owner dapat menambah bahan; nama unik secara case-insensitive', function () {
    $this->actingAs($this->owner)->post('/bahan-baku', [
        'name' => 'Sirup Vanilla',
        'base_unit' => 'ml',
        'cost_per_unit' => 120,
        'minimum_stock' => 200,
        'package_size' => 750,
        'package_price' => 90000,
    ])->assertRedirect();

    expect(Ingredient::where('name', 'Sirup Vanilla')->exists())->toBeTrue();

    $this->actingAs($this->owner)->post('/bahan-baku', [
        'name' => 'sirup vanilla',
        'base_unit' => 'ml',
    ])->assertSessionHasErrors('name');
});

it('stock-in memperbarui stok dan WAC (BL 6.2)', function () {
    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();
    $biji->forceFill(['current_stock' => 400, 'cost_per_unit' => 250])->save();

    $this->actingAs($this->owner)->post("/bahan-baku/{$biji->id}/stock-in", [
        'quantity_base' => '1000',
        'unit_price_base' => '300',
    ])->assertRedirect();

    $biji->refresh();
    expect((string) $biji->current_stock)->toBe('1400.000')
        ->and((string) $biji->cost_per_unit)->toBe('285.7143');
});

it('input penawaran memperbarui HPP proyeksi menu terkait', function () {
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();
    expect((string) $menu->projected_hpp)->toBe('12294.00');

    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();
    $this->actingAs($this->owner)
        ->post("/bahan-baku/{$biji->id}/quote", ['quote_price' => 250])
        ->assertRedirect();

    expect((string) $menu->fresh()->projected_hpp)->toBe('11244.00');
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/bahan-baku')->assertRedirect('/login');
});
