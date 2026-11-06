<?php

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\RecipeIngredient;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

it('menampilkan daftar menu dan bahan dari database', function () {
    $this->actingAs($this->owner)
        ->get('/menu')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('menus')
            ->has('menus', 5)
            ->has('ingredients', 10));
});

it('staff boleh melihat tetapi tidak boleh menambah menu (SAD §9)', function () {
    $this->actingAs($this->staff)->get('/menu')->assertOk();

    $this->actingAs($this->staff)
        ->post('/menu', ['name' => 'X', 'category' => 'Kopi', 'selling_price' => 10000])
        ->assertForbidden();
});

it('owner dapat menambah menu; nama unik secara case-insensitive', function () {
    $this->actingAs($this->owner)->post('/menu', [
        'name' => 'Cokelat Panas',
        'category' => 'Non-Kopi',
        'selling_price' => 16000,
        'overhead' => 1000,
    ])->assertRedirect();

    expect(Menu::where('name', 'Cokelat Panas')->exists())->toBeTrue();

    $this->actingAs($this->owner)->post('/menu', [
        'name' => 'cokelat panas',
        'category' => 'Non-Kopi',
        'selling_price' => 16000,
    ])->assertSessionHasErrors('name');
});

it('menyimpan BOM lalu menghitung ulang HPP (FR-012)', function () {
    $menu = Menu::create([
        'name' => 'Uji Menu',
        'category' => 'Kopi',
        'selling_price' => 20000,
        'overhead' => 1000,
    ]);

    $biji = Ingredient::where('name', 'Biji Kopi Arabika')->firstOrFail();

    $this->actingAs($this->owner)
        ->post("/menu/{$menu->id}/recipe", [
            'items' => [
                ['ingredient_id' => $biji->id, 'quantity_needed' => 20, 'waste_factor' => 0.05],
            ],
        ])->assertRedirect();

    $menu->refresh();
    expect($menu->recipe()->exists())->toBeTrue()
        ->and(RecipeIngredient::where('recipe_id', $menu->recipe->id)->count())->toBe(1)
        ->and((string) $menu->current_hpp)->toBe('6250.00');
});

it('tamu diarahkan ke halaman login', function () {
    $this->get('/menu')->assertRedirect('/login');
});
