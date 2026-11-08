<?php

use App\Models\Ingredient;
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

it('owner dapat melihat detail rencana restock', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 500000])->assertRedirect();
    $plan = RestockPlan::firstOrFail();

    $this->actingAs($this->owner)
        ->get("/restock/plans/{$plan->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('restock-plan-detail')
            ->where('plan.id', $plan->id)
            ->has('plan.items')
            ->has('recent_plans'));
});

it('staff tidak boleh melihat detail rencana restock', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 500000])->assertRedirect();
    $plan = RestockPlan::firstOrFail();

    $this->actingAs($this->staff)
        ->get("/restock/plans/{$plan->id}")
        ->assertForbidden();
});

it('owner dapat menyetujui rencana draft (draft -> approved)', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 500000])->assertRedirect();
    $plan = RestockPlan::firstOrFail();

    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/approve")->assertRedirect();

    expect($plan->fresh()->status)->toBe('approved')
        ->and($plan->fresh()->approved_at)->not->toBeNull();
});

it('owner dapat menandai rencana dipesan langsung dari draft atau approved (ordered)', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 500000])->assertRedirect();
    $plan = RestockPlan::firstOrFail();

    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/order", [
        'notes' => 'Dipesan via WA ke Agen Kopi Surya',
    ])->assertRedirect();

    expect($plan->fresh()->status)->toBe('ordered')
        ->and($plan->fresh()->ordered_at)->not->toBeNull()
        ->and($plan->fresh()->notes)->toBe('Dipesan via WA ke Agen Kopi Surya');
});

it('owner dapat membatalkan rencana restock dengan alasan (cancelled)', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 500000])->assertRedirect();
    $plan = RestockPlan::firstOrFail();

    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/cancel", [
        'reason' => 'Perubahan menu akhir pekan',
    ])->assertRedirect();

    expect($plan->fresh()->status)->toBe('cancelled')
        ->and($plan->fresh()->cancelled_at)->not->toBeNull()
        ->and($plan->fresh()->cancellation_reason)->toBe('Perubahan menu akhir pekan');

    // Menolak eksekusi pembelian rencana yang dibatalkan
    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/purchase")->assertSessionHasErrors('plan');
});

it('pembelian parsial hanya menambah stok sesuai barang yang diterima faktual', function () {
    $this->actingAs($this->owner)->post('/restock/plans', ['cash_amount' => 1500000])->assertRedirect();
    $plan = RestockPlan::with('items.ingredient')->firstOrFail();

    $firstItem = $plan->items->where('recommended_packages', '>', 0)->firstOrFail();
    $initialStock = (float) $firstItem->ingredient->current_stock;
    $packageSize = (float) ($firstItem->ingredient->package_size ?? '1');

    // Beli hanya 1 pack padahal rekomendasinya mungkin lebih
    $this->actingAs($this->owner)->post("/restock/plans/{$plan->id}/purchase", [
        'items' => [
            [
                'ingredient_id' => $firstItem->ingredient_id,
                'purchased_packages' => 1,
                'actual_package_price' => (int) $firstItem->ingredient->package_price,
            ],
        ],
    ])->assertRedirect();

    expect($plan->fresh()->status)->toBe('purchased')
        ->and($plan->fresh()->actual_cost)->toBeGreaterThan(0)
        ->and((float) $firstItem->ingredient->fresh()->current_stock)->toBe($initialStock + (1 * $packageSize));
});

it('dapat membuat purchase order lengkap dengan rincian shipment dan item kustom melalui wizard', function () {
    $ingredient = Ingredient::firstOrFail();

    $this->actingAs($this->owner)->post('/restock/plans', [
        'cash_amount' => 600000,
        'delivery_date' => '2026-11-15',
        'payment_terms' => 'COD (Cash on Delivery)',
        'notes' => 'Harap diantar pagi hari',
        'status' => 'draft',
        'items' => [
            [
                'ingredient_id' => $ingredient->id,
                'recommended_packages' => 2,
            ],
        ],
    ])->assertRedirect();

    $plan = RestockPlan::with('items')->orderByDesc('id')->firstOrFail();
    expect($plan->cash_amount)->toBe(600000)
        ->and($plan->status)->toBe('draft')
        ->and($plan->notes)->toContain('Target: 2026-11-15')
        ->and($plan->notes)->toContain('Bayar: COD (Cash on Delivery)')
        ->and($plan->items()->count())->toBe(1);
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/restock')->assertRedirect('/login');
});
