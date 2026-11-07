<?php

use App\Models\Menu;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
});

/**
 * PNG 1x1 valid agar lolos validasi `image` tanpa bergantung ekstensi GD.
 */
function fakeMenuImage(): UploadedFile
{
    $png = base64_decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        true,
    );

    return UploadedFile::fake()->createWithContent('menu.png', $png);
}

/**
 * Posisi menu pada props daftar (urutan sama dengan controller: nama menaik,
 * hanya menu aktif ber-BOM untuk POS).
 */
function menuPropIndex(Menu $menu, bool $posOnly = false): int
{
    $query = Menu::with('recipe.items')->orderBy('name');

    if ($posOnly) {
        $query->where('is_active', true);
    }

    $rows = $query->get()->filter(
        $posOnly
            ? fn (Menu $m) => $m->recipe !== null && $m->recipe->items->isNotEmpty()
            : fn (Menu $m) => true
    )->values();

    $index = $rows->search(fn (Menu $m) => $m->id === $menu->id);

    return $index === false ? -1 : (int) $index;
}

it('owner dapat mengunggah foto saat menambah menu; image_url tampil di props', function () {
    $this->actingAs($this->owner)->post('/menu', [
        'name' => 'Teh Tarik Pandan',
        'category' => 'Non-Kopi',
        'selling_price' => 18000,
        'image' => fakeMenuImage(),
    ])->assertRedirect();

    $menu = Menu::where('name', 'Teh Tarik Pandan')->firstOrFail();

    expect($menu->image_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $menu->image_path))->toBeTrue();

    $url = Storage::disk('public')->url((string) $menu->image_path);

    $this->actingAs($this->owner)->get('/menu')->assertInertia(
        fn (Assert $page) => $page
            ->component('menus')
            ->where('menus.'.menuPropIndex($menu).'.image_url', $url)
    );
});

it('owner dapat mengganti foto menu; foto lama dihapus dari storage', function () {
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();
    $oldPath = 'menus/old-photo.png';
    Storage::disk('public')->put($oldPath, 'x');
    $menu->forceFill(['image_path' => $oldPath])->save();

    $this->actingAs($this->owner)
        ->post("/menu/{$menu->id}", [
            '_method' => 'put',
            'name' => $menu->name,
            'category' => 'Kopi',
            'selling_price' => $menu->selling_price,
            'image' => fakeMenuImage(),
        ])->assertRedirect();

    $menu->refresh();

    expect($menu->image_path)->not->toBeNull()
        ->and($menu->image_path)->not->toBe($oldPath)
        ->and(Storage::disk('public')->exists($oldPath))->toBeFalse()
        ->and(Storage::disk('public')->exists((string) $menu->image_path))->toBeTrue();
});

it('owner dapat menghapus foto menu lewat remove_image', function () {
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();
    $path = 'menus/photo.png';
    Storage::disk('public')->put($path, 'x');
    $menu->forceFill(['image_path' => $path])->save();

    $this->actingAs($this->owner)
        ->post("/menu/{$menu->id}", [
            '_method' => 'put',
            'name' => $menu->name,
            'category' => 'Kopi',
            'selling_price' => $menu->selling_price,
            'remove_image' => true,
        ])->assertRedirect();

    $menu->refresh();

    expect($menu->image_path)->toBeNull()
        ->and(Storage::disk('public')->exists($path))->toBeFalse();
});

it('image_url menu ber-BOM tampil di props POS', function () {
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();
    $path = 'menus/es-kopi.png';
    Storage::disk('public')->put($path, 'x');
    $menu->forceFill(['image_path' => $path])->save();

    $url = Storage::disk('public')->url($path);
    $index = menuPropIndex($menu, posOnly: true);

    $this->actingAs($this->staff)->get('/pos')->assertInertia(
        fn (Assert $page) => $page
            ->component('pos')
            ->where('menus.'.$index.'.image_url', $url)
    );
});

it('file non-gambar ditolak dengan error per field (NFR-008)', function () {
    $this->actingAs($this->owner)
        ->post('/menu', [
            'name' => 'Menu Gagal',
            'category' => 'Kopi',
            'selling_price' => 10000,
            'image' => UploadedFile::fake()->create('catatan.pdf', 10, 'application/pdf'),
        ])->assertSessionHasErrors('image');

    expect(Menu::where('name', 'Menu Gagal')->exists())->toBeFalse();
});

it('staff tidak dapat mengunggah foto menu (FR-002)', function () {
    $menu = Menu::where('name', 'Es Kopi Susu Aren')->firstOrFail();

    $this->actingAs($this->staff)
        ->post("/menu/{$menu->id}", [
            '_method' => 'put',
            'name' => $menu->name,
            'category' => 'Kopi',
            'selling_price' => $menu->selling_price,
            'image' => fakeMenuImage(),
        ])->assertForbidden();

    expect($menu->fresh()->image_path)->toBeNull();
});
