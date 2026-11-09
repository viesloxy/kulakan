<?php

namespace App\Http\Controllers;

use App\Http\Requests\Menu\SaveRecipeRequest;
use App\Http\Requests\Menu\StoreMenuRequest;
use App\Http\Requests\Menu\UpdateMenuRequest;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Services\AlertService;
use App\Services\CostingService;
use App\Support\Number;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function __construct(
        private readonly CostingService $costing,
        private readonly AlertService $alerts,
    ) {}

    public function index(): Response
    {
        $menus = Menu::with('recipe.items.ingredient')->orderBy('name')->get();

        $ingredients = Ingredient::orderBy('name')
            ->get(['id', 'name', 'base_unit', 'is_active'])
            ->map(fn (Ingredient $i) => [
                'id' => $i->id,
                'name' => $i->name,
                'base_unit' => $i->base_unit,
                'is_active' => (bool) $i->is_active,
            ])->values();

        return Inertia::render('menus', [
            'menus' => $menus->map(fn (Menu $m) => $this->resource($m))->values(),
            'ingredients' => $ingredients,
        ]);
    }

    public function store(StoreMenuRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $menu = Menu::create([
            'name' => $data['name'],
            'category' => $data['category'],
            'image_path' => $this->storeImage($request),
            'selling_price' => $data['selling_price'],
            'overhead' => $data['overhead'] ?? 0,
            'is_active' => true,
        ]);

        $this->costing->recalculateMenu($menu->fresh());

        return back()->with('success', 'Menu '.$menu->name.' ditambahkan. Susun BOM agar bisa dijual di POS.');
    }

    public function update(UpdateMenuRequest $request, Menu $menu): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $this->deleteImage($menu);
            $data['image_path'] = $this->storeImage($request);
        } elseif ($request->boolean('remove_image')) {
            $this->deleteImage($menu);
            $data['image_path'] = null;
        }

        $menu->fill($data)->save();

        $this->costing->recalculateMenu($menu->fresh());

        return back()->with('success', 'Menu '.$menu->name.' diperbarui.');
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        $menu->forceFill(['is_active' => false])->save();

        return back()->with('success', 'Menu '.$menu->name.' dinonaktifkan.');
    }

    public function saveRecipe(SaveRecipeRequest $request, Menu $menu): RedirectResponse
    {
        $data = $request->validated();

        $recipe = DB::transaction(function () use ($menu, $data): Recipe {
            /** @var Recipe $recipe */
            $recipe = $menu->recipe ?? Recipe::create(['menu_id' => $menu->id]);

            $recipe->forceFill([
                'yield_portions' => $data['yield_portions'] ?? 1,
                'notes' => $data['notes'] ?? null,
            ])->save();

            $recipe->items()->delete();

            foreach ($data['items'] as $item) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'ingredient_id' => (int) $item['ingredient_id'],
                    'quantity_needed' => $item['quantity_needed'],
                    'waste_factor' => $item['waste_factor'] ?? 0,
                ]);
            }

            return $recipe->load('items');
        });

        $this->costing->recalculateMenu($menu->fresh()->load('recipe.items.ingredient'));

        $this->alerts->syncAll();

        return back()->with('success', 'Resep '.$menu->name.' disimpan ('.count($data['items']).' bahan, yield '.$recipe->yield_portions.' porsi).');
    }

    /**
     * @return array<string, mixed>
     */
    private function resource(Menu $menu): array
    {
        $menu->loadMissing('recipe.items.ingredient');

        $items = [];
        $subtotal = '0';
        $recipe = $menu->recipe;

        if ($recipe !== null) {
            foreach ($recipe->items as $item) {
                $effective = $this->costing->effectiveQty(
                    (string) $item->quantity_needed,
                    (string) $item->waste_factor,
                );
                $lineCost = bcmul($effective, Number::str($item->ingredient->cost_per_unit), 6);
                $subtotal = bcadd($subtotal, $lineCost, 6);

                $items[] = [
                    'ingredient_id' => $item->ingredient_id,
                    'ingredient_name' => $item->ingredient->name,
                    'base_unit' => $item->ingredient->base_unit,
                    'quantity_needed' => bcadd(Number::str($item->quantity_needed), '0', 3),
                    'waste_factor' => bcadd(Number::str($item->waste_factor), '0', 3),
                    'cost_per_unit' => bcadd(Number::str($item->ingredient->cost_per_unit), '0', 4),
                    'effective_qty' => bcadd($effective, '0', 3),
                    'line_cost' => $this->roundMoney($lineCost),
                    'is_active' => (bool) ($item->ingredient->is_active ?? true),
                ];
            }
        }

        return [
            'id' => $menu->id,
            'name' => $menu->name,
            'category' => $menu->category ?? 'Kopi',
            'image_url' => $menu->image_url,
            'selling_price' => $menu->selling_price,
            'overhead' => $menu->overhead,
            'yield_portions' => max(1, $recipe !== null ? (int) $recipe->yield_portions : 1),
            'is_active' => $menu->is_active,
            'current_hpp' => bcadd(Number::str($menu->current_hpp), '0', 2),
            'margin_pct' => bcadd(Number::str($menu->margin_pct), '0', 2),
            'status' => $menu->status,
            'projected_hpp' => $menu->projected_hpp !== null ? bcadd(Number::str($menu->projected_hpp), '0', 2) : null,
            'projected_margin_pct' => $menu->projected_margin_pct !== null ? bcadd(Number::str($menu->projected_margin_pct), '0', 2) : null,
            'projected_status' => $menu->projected_status,
            'subtotal' => $this->roundMoney($subtotal),
            'portions_available' => $this->costing->portionsAvailable($menu),
            'bom' => $items,
        ];
    }

    /**
     * @return numeric-string
     */
    private function roundMoney(string $value): string
    {
        return bcadd(Number::str($value), '0', 2);
    }

    /**
     * Simpan gambar menu yang diunggah ke disk public.
     */
    private function storeImage(StoreMenuRequest|UpdateMenuRequest $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        $path = $request->file('image')?->store('menus', 'public');

        return is_string($path) ? $path : null;
    }

    /**
     * Hapus file gambar lama dari disk public (bila ada).
     */
    private function deleteImage(Menu $menu): void
    {
        if ($menu->image_path !== null) {
            Storage::disk('public')->delete($menu->image_path);
        }
    }
}
