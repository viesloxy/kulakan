<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('merangkum dashboard eksekutif dari data DB (FR-036)', function () {
    $this->actingAs($this->owner)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('menu_counts.total', 5)
            ->where('menu_counts.profitable', 3)
            ->where('menu_counts.watchlist', 1)
            ->where('menu_counts.loss', 1)
            ->where('active_alerts_count', 4)
            ->where('orders_today_count', 1)
            ->where('inventory_value', fn ($value) => $value > 0)
            ->has('top_profitable_menus')
            ->has('chart', 7)
            ->has('recent_orders', 5)
            ->has('wallets.cash')
            ->has('restock.total_cost'));
});

it('menyediakan laporan harian penjualan & pembelian (FR-037)', function () {
    $this->actingAs($this->owner)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('daily_report.date', now()->toDateString())
            ->where('daily_report.sales.orders', 1)
            ->where('daily_report.sales.revenue', 708000)
            ->where('daily_report.sales.items', 35)
            ->where('daily_report.purchases.count', 0));

    $this->actingAs($this->owner)
        ->get('/dashboard?report_date=2020-01-01')
        ->assertInertia(fn (Assert $page) => $page
            ->where('daily_report.sales.orders', 0)
            ->where('daily_report.sales.revenue', 0));
});

it('staff tidak boleh mengakses dashboard (owner-only)', function () {
    $this->actingAs($this->staff)->get('/dashboard')->assertForbidden();
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});
