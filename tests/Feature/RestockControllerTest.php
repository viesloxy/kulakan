<?php

use App\Models\RestockPlan;
use App\Models\RestockPlanItem;
use App\Models\StockMovement;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('menampilkan rencana restock awal dari data DB', function () {
    $this->actingAs($this->owner)
        ->get('/restock')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('restock')
            ->where('default_cash_amount', 500000)
            ->has('plan.items')
            ->where('last_plan', null));
});

it('menyimpan rencana draft dengan total tidak melebihi kas (INV-05)', function () {
    $this->actingAs($this->owner)
        ->post('/restock/plans', ['cash_amount' => 500000])
        ->assertRedirect();

    $plan = RestockPlan::with('items')->firstOrFail();

    expect($plan->status)->toBe('draft')
        ->and($plan->total_cost)->toBeLessThanOrEqual(500000)
        ->and($plan->remaining_cash)->toBe(500000 - $plan->total_cost)
        ->and($plan->items()->count())->toBeGreaterThan(0);
});

it('menandai purchased menambah stok sesuai rekomendasi (FR-031)', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 1500000])->assertRedirect();
    $plan = RestockPlan::firstOrFail();

    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/purchase")->assertRedirect();

    expect($plan->fresh()->status)->toBe('purchased')
        ->and($plan->fresh()->purchased_at)->not->toBeNull()
        ->and(StockMovement::where('reason', 'restock')->count())->toBeGreaterThan(0)
        ->and(RestockPlanItem::where('restock_plan_id', $plan->id)->where('purchased_packages', '>', 0)->count())->toBeGreaterThan(0);
});

it('menolak menandai purchased dua kali', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 500000])->assertRedirect();
    $plan = RestockPlan::firstOrFail();

    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/purchase")->assertRedirect();
    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/purchase")->assertSessionHasErrors('plan');
});

it('staff tidak boleh mengakses restock (owner-only)', function () {
    $this->actingAs($this->staff)->get('/restock')->assertForbidden();
    $this->actingAs($this->staff)->post('/restock/plans', ['cash_amount' => 500000])->assertForbidden();
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/restock')->assertRedirect('/login');
});
