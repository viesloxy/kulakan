<?php

use App\Models\Ingredient;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('menampilkan profitabilitas menu dari database', function () {
    $this->actingAs($this->owner)
        ->get('/profitabilitas')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profitability')
            ->has('menus', 5)
            ->has('summary.counts.profitable')
            ->has('ingredients', 10)
            ->where('simulation', null));
});

it('simulasi harga bahan menghitung HPP what-if (BL §6.4)', function () {
    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();

    $this->actingAs($this->owner)
        ->get("/profitabilitas?sim_ingredient={$biji->id}&sim_price=300")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profitability')
            ->where('filters.sim_ingredient', $biji->id)
            ->has('simulation', 3)
            ->where('simulation', function ($simulation) {
                expect($simulation[0]['name'])->toBe('Es Kopi Susu Aren')
                    ->and($simulation[0]['old_hpp'])->toBe('11244.00')
                    ->and($simulation[0]['new_hpp'])->toBe('12294.00')
                    ->and($simulation[0]['old_status'])->toBe('profitable')
                    ->and($simulation[0]['new_status'])->toBe('watchlist');

                return true;
            }));
});

it('staff tidak boleh mengakses profitabilitas (owner-only)', function () {
    $this->actingAs($this->staff)->get('/profitabilitas')->assertForbidden();
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/profitabilitas')->assertRedirect('/login');
});
