<?php

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\SalesOrder;
use App\Models\StockMovement;
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
    $latestOrder = SalesOrder::latest('id')->firstOrFail();

    expect(bcsub($before, $after, 3))->toBe('210.000')
        ->and(SalesOrder::count())->toBe(8) // 7 hari seeder + 1 pesanan POS
        ->and($latestOrder->status)->toBe('preparing');
});

it('staf dapat memperbarui status pesanan dari preparing ke ready lalu completed', function () {
    $order = SalesOrder::create([
        'order_number' => 'ORD-TEST-0001',
        'user_id' => $this->staff->id,
        'total_amount' => 20000,
        'payment_method' => 'cash',
        'status' => 'preparing',
    ]);

    // Tandai siap
    $this->actingAs($this->staff)
        ->patch("/pesanan/{$order->id}/status", ['status' => 'ready'])
        ->assertRedirect();
    expect($order->fresh()->status)->toBe('ready');

    // Tandai selesai
    $this->actingAs($this->staff)
        ->patch("/pesanan/{$order->id}/status", ['status' => 'completed'])
        ->assertRedirect();
    expect($order->fresh()->status)->toBe('completed');
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

it('void pesanan mengembalikan stok dan dikecualikan dari laporan (FR-018, DEC-13)', function () {
    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();
    $order = SalesOrder::whereDate('created_at', now()->toDateString())->firstOrFail();
    $before = (string) $biji->current_stock;

    $this->actingAs($this->owner)->post("/pos/{$order->id}/void")->assertRedirect();

    // Order hari ini: Es Kopi x16 (21 g) + Kopi Hitam x10 (16,8 g) + Hazelnut x4 (21 g) = 588 g.
    expect(bcsub((string) $biji->fresh()->current_stock, $before, 3))->toBe('588.000')
        ->and($order->fresh()->status)->toBe('void')
        ->and(StockMovement::where('sales_order_id', $order->id)->where('type', 'sale_reversal')->exists())->toBeTrue();

    // Void kedua ditolak.
    $this->actingAs($this->owner)->post("/pos/{$order->id}/void")->assertSessionHasErrors('void');

    // Staff tidak boleh void (owner-only).
    $other = SalesOrder::where('status', 'completed')->firstOrFail();
    $this->actingAs($this->staff)->post("/pos/{$other->id}/void")->assertForbidden();
});

it('void pesanan dengan opsi waste mencatat limbah operasional dan tidak memulihkan stok fisik', function () {
    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();
    $order = SalesOrder::whereDate('created_at', now()->toDateString())->firstOrFail();
    $before = (string) $biji->current_stock;

    $this->actingAs($this->owner)->post("/pesanan/{$order->id}/void", [
        'handling' => 'wasted',
        'reason' => 'Tumpah saat racik',
    ])->assertRedirect();

    $freshOrder = $order->fresh();
    expect($freshOrder->status)->toBe('void')
        ->and($freshOrder->void_type)->toBe('wasted')
        ->and($freshOrder->void_reason)->toBe('Tumpah saat racik')
        ->and((string) $biji->fresh()->current_stock)->toBe($before)
        ->and(StockMovement::where('sales_order_id', $order->id)->where('type', 'waste')->exists())->toBeTrue()
        ->and(StockMovement::where('sales_order_id', $order->id)->where('type', 'sale_reversal')->exists())->toBeTrue();
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/pos')->assertRedirect('/login');
});
