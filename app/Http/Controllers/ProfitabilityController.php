<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Menu;
use App\Services\CostingService;
use App\Support\Number;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfitabilityController extends Controller
{
    public function __construct(private readonly CostingService $costing) {}

    public function index(Request $request): Response
    {
        $menus = Menu::orderBy('name')->get();

        $rows = $menus->map(fn (Menu $menu) => [
            'id' => $menu->id,
            'name' => $menu->name,
            'category' => $menu->category ?? 'Kopi',
            'selling_price' => $menu->selling_price,
            'current_hpp' => bcadd(Number::str($menu->current_hpp), '0', 2),
            'margin_rupiah' => bcsub(Number::str($menu->selling_price), Number::str($menu->current_hpp), 2),
            'margin_pct' => bcadd(Number::str($menu->margin_pct), '0', 2),
            'status' => $menu->status,
            'projected_hpp' => $menu->projected_hpp !== null ? bcadd(Number::str($menu->projected_hpp), '0', 2) : null,
            'projected_margin_pct' => $menu->projected_margin_pct !== null ? bcadd(Number::str($menu->projected_margin_pct), '0', 2) : null,
            'projected_status' => $menu->projected_status,
        ])->values();

        $counts = ['profitable' => 0, 'watchlist' => 0, 'loss' => 0];
        foreach ($menus as $menu) {
            $counts[$menu->status] = ($counts[$menu->status] ?? 0) + 1;
        }

        // Simulasi harga (what-if) lewat query param; hasil dihitung di CostingService (NFR-010).
        $simIngredientId = $request->integer('sim_ingredient') ?: null;
        $simPrice = $request->string('sim_price')->toString();
        $simulation = null;

        if ($simIngredientId !== null && is_numeric($simPrice)) {
            $ingredient = Ingredient::find($simIngredientId);
            if ($ingredient !== null) {
                $simulation = $this->costing->simulateIngredientPrice($ingredient, $simPrice);
            }
        }

        return Inertia::render('profitability', [
            'menus' => $rows,
            'summary' => [
                'total' => $menus->count(),
                'avg_margin' => $this->costing->averageMargin(),
                'counts' => $counts,
            ],
            'ingredients' => Ingredient::where('is_active', true)->orderBy('name')
                ->get(['id', 'name', 'base_unit', 'cost_per_unit'])
                ->map(fn (Ingredient $i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'base_unit' => $i->base_unit,
                    'cost_per_unit' => bcadd(Number::str($i->cost_per_unit), '0', 4),
                ])->values(),
            'filters' => [
                'sim_ingredient' => $simIngredientId,
                'sim_price' => $simPrice,
            ],
            'simulation' => $simulation,
        ]);
    }
}
