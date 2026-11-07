<?php

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\SalesOrder;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('menampilkan menu yang siap dijual di POS', function () {
    $this->actingAs($this->staff)
        ->get('/pos')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos')
            ->has('menus', 5));
});

it('staff dapat menyimpan pesanan dan stok bahan terpotong (FR-013-017)', function () {
    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();
    $before = (string) $biji->current_stock;

    $this->actingAs($this->staff)
        ->post('/pos', [
            'lines' => [['menu_id' => $menu->id, 'quantity' => 10]],
            'payment_method' => 'cash',
        ])->assertRedirect();

    $after = (string) $biji->fresh()->current_stock;

    expect(bcsub($before, $after, 3))->toBe('210.000')
        ->and(SalesOrder::count())->toBe(8); // 7 hari seeder + 1 pesanan POS
});

it('menolak pesanan bila stok tidak cukup (FR-015, BR-032)', function () {
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();

    $this->actingAs($this->staff)
        ->post('/pos', [
            'lines' => [['menu_id' => $menu->id, 'quantity' => 999]],
            'payment_method' => 'qris',
        ])
        ->assertSessionHasErrors('order');

    expect(SalesOrder::count())->toBe(7); // tidak ada pesanan baru
});

it('mencegah pemotongan ganda dengan idempotency key (FR-016)', function () {
    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();
    $before = (string) $biji->current_stock;

    $payload = [
        'lines' => [['menu_id' => $menu->id, 'quantity' => 10]],
        'payment_method' => 'cash',
        'idempotency_key' => 'test-key-12345',
    ];

    $this->actingAs($this->staff)->post('/pos', $payload)->assertRedirect();
    $this->actingAs($this->staff)->post('/pos', $payload)->assertRedirect();

    expect(SalesOrder::count())->toBe(8)
        ->and(bcsub($before, (string) $biji->fresh()->current_stock, 3))->toBe('210.000');
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/pos')->assertRedirect('/login');
});
