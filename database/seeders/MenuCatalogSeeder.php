<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Services\CostingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder katalog menu kafe & bahan baku lengkap (15-25 menu realistis).
 *
 * Sifat: Idempoten & aman dijalankan berulang kali ("menambahkan bukan menumpuk").
 * Menggunakan lookup nama case-insensitive agar tidak menduplikasi data yang sudah ada,
 * serta menghitung ulang HPP dan margin secara otomatis via CostingService.
 */
class MenuCatalogSeeder extends Seeder
{
    public function run(): void
    {
        /** @var CostingService $costing */
        $costing = app(CostingService::class);

        DB::transaction(function () use ($costing) {
            $ingredients = $this->seedIngredients();
            $this->seedMenusAndRecipes($ingredients, $costing);
        });
    }

    /**
     * Daftarkan seluruh bahan baku operasional kafe (kopi, susu, sirup, bubuk, bakery, makanan gurih).
     *
     * @return array<string, Ingredient>
     */
    private function seedIngredients(): array
    {
        /**
         * Format:
         * [Nama, Base Unit (gram|ml|pcs), Stok Awal, Min Stok, Lead Time (hari), Pack Size, Pack Price, Cost Per Unit, Last Quote Price]
         */
        $definitions = [
            // Bahan Baku Kopi & Minuman Dasar
            ['Biji Kopi Arabika', 'gram', 5000, 500, 2, 500, 125000, 250, 300],
            ['Biji Kopi Robusta', 'gram', 3000, 300, 3, 500, 60000, 120, null],
            ['Susu UHT', 'ml', 35000, 2000, 1, 1000, 18000, 18, null],
            ['Gula Aren Cair', 'ml', 8000, 500, 2, 1000, 40000, 40, null],
            ['Cup + Lid', 'pcs', 500, 100, 3, 50, 25000, 500, null],
            ['Es Batu', 'gram', 30000, 3000, 1, 5000, 10000, 2, null],

            // Sirup & Perasa Minuman
            ['Sirup Karamel', 'ml', 3000, 200, 3, 750, 95000, 126.6667, null],
            ['Sirup Vanilla', 'ml', 3000, 200, 3, 750, 90000, 120, null],
            ['Sirup Hazelnut', 'ml', 2000, 200, 3, 750, 95000, 126.6667, null],
            ['Sirup Lemon', 'ml', 3000, 200, 2, 750, 75000, 100, null],
            ['Sirup Lychee', 'ml', 3000, 200, 2, 750, 85000, 113.3333, null],
            ['Buah Leci Kaleng', 'gram', 3000, 300, 3, 565, 38000, 67.2566, null],

            // Bubuk & Daun Teh
            ['Matcha Powder', 'gram', 2000, 150, 5, 100, 85000, 850, null],
            ['Bubuk Cokelat Premium', 'gram', 4000, 200, 3, 1000, 110000, 110, null],
            ['Bubuk Red Velvet', 'gram', 3000, 200, 3, 1000, 120000, 120, null],
            ['Teh Hitam Celup / Daun', 'gram', 2500, 200, 2, 500, 45000, 90, null],

            // Susu Tambahan
            ['Susu Evaporasi', 'ml', 6000, 500, 2, 380, 17000, 44.7368, null],
            ['Susu Kental Manis', 'ml', 6000, 500, 2, 500, 16000, 32, null],

            // Bahan Bakery & Makanan
            ['Roti Tawar', 'pcs', 300, 30, 1, 20, 30000, 1500, null],
            ['Keju Cheddar', 'gram', 5000, 500, 2, 1000, 120000, 120, null],
            ['Selai Cokelat Nutella', 'gram', 2500, 300, 3, 350, 48000, 137.1429, null],
            ['Margarin / Mentega', 'gram', 4000, 400, 2, 1000, 35000, 35, null],
            ['Croissant Frozen / Dough', 'pcs', 120, 15, 2, 10, 75000, 7500, null],
            ['Kentang Goreng Shoestring', 'gram', 12000, 1000, 2, 2000, 80000, 40, null],
            ['Minyak Goreng', 'ml', 12000, 1000, 1, 2000, 34000, 17, null],
            ['Sosis Sapi Bratwurst', 'pcs', 160, 20, 2, 10, 65000, 6500, null],
            ['Bumbu Tabur BBQ', 'gram', 2500, 200, 3, 500, 35000, 70, null],
            ['Daging Patty Burger', 'pcs', 100, 15, 2, 10, 85000, 8500, null],
            ['Roti Bun Burger', 'pcs', 100, 15, 1, 10, 25000, 2500, null],
            ['Saus Sambal & Tomat', 'gram', 6000, 500, 1, 1000, 22000, 22, null],
            ['Plastik Mika / Paper Box', 'pcs', 600, 100, 3, 50, 35000, 700, null],
        ];

        $map = [];
        foreach ($definitions as [$name, $unit, $stock, $min, $lead, $packSize, $packPrice, $cost, $quote]) {
            $existing = Ingredient::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();

            if (! $existing) {
                $existing = Ingredient::create([
                    'name' => $name,
                    'base_unit' => $unit,
                    'current_stock' => $stock,
                    'minimum_stock' => $min,
                    'cost_per_unit' => $cost,
                    'last_quote_price' => $quote,
                    'last_quote_at' => $quote !== null ? now() : null,
                    'lead_time_days' => $lead,
                    'review_period_days' => 2,
                    'package_size' => $packSize,
                    'package_price' => $packPrice,
                    'moq_packages' => 1,
                    'is_active' => true,
                ]);
            } else {
                // Jika stok habis/kurang, pastikan stok mencukupi untuk operasional
                if ((float) $existing->current_stock < (float) $min) {
                    $existing->update(['current_stock' => $stock]);
                }
            }

            $map[$name] = $existing;
        }

        return $map;
    }

    /**
     * Daftarkan menu kafe beserta resep (BOM) rincian bahan baku.
     *
     * @param  array<string, Ingredient>  $ingredients
     */
    private function seedMenusAndRecipes(array $ingredients, CostingService $costing): void
    {
        /**
         * Format:
         * [Nama Menu, Kategori (Kopi|Non-Kopi|Makanan), Harga Jual (Rp), Overhead (Rp), BOM [Bahan => [Kuantitas, Waste Factor (0-0.5)]]]
         */
        $definitions = [
            // ==========================================
            // KATEGORI: KOPI (8 Menu)
            // ==========================================
            [
                'Americano Dingin',
                'Kopi',
                18000,
                500,
                [
                    'Biji Kopi Arabika' => [18, 0.05],
                    'Es Batu' => [120, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Caffe Latte',
                'Kopi',
                24000,
                1500,
                [
                    'Biji Kopi Arabika' => [18, 0.05],
                    'Susu UHT' => [200, 0.02],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Cappuccino',
                'Kopi',
                24000,
                1500,
                [
                    'Biji Kopi Arabika' => [18, 0.05],
                    'Susu UHT' => [150, 0.02],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Caramel Macchiato',
                'Kopi',
                28000,
                1500,
                [
                    'Biji Kopi Arabika' => [18, 0.05],
                    'Susu UHT' => [180, 0.02],
                    'Sirup Karamel' => [25, 0],
                    'Sirup Vanilla' => [10, 0],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Vanilla Latte',
                'Kopi',
                26000,
                1500,
                [
                    'Biji Kopi Arabika' => [18, 0.05],
                    'Susu UHT' => [200, 0.02],
                    'Sirup Vanilla' => [25, 0],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Kopi Susu Aren Double Shot',
                'Kopi',
                25000,
                1500,
                [
                    'Biji Kopi Arabika' => [28, 0.05],
                    'Susu UHT' => [120, 0.02],
                    'Gula Aren Cair' => [30, 0.03],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Mocha Latte',
                'Kopi',
                27000,
                1500,
                [
                    'Biji Kopi Arabika' => [18, 0.05],
                    'Bubuk Cokelat Premium' => [20, 0.03],
                    'Susu UHT' => [180, 0.02],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Kopi Tarik Klasik',
                'Kopi',
                18000,
                1000,
                [
                    'Biji Kopi Robusta' => [20, 0.05],
                    'Susu Kental Manis' => [40, 0],
                    'Susu Evaporasi' => [30, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],

            // ==========================================
            // KATEGORI: NON-KOPI (7 Menu)
            // ==========================================
            [
                'Signature Choco Cream',
                'Non-Kopi',
                24000,
                1500,
                [
                    'Bubuk Cokelat Premium' => [30, 0.03],
                    'Susu UHT' => [200, 0.02],
                    'Susu Kental Manis' => [20, 0],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Red Velvet Latte',
                'Non-Kopi',
                25000,
                1500,
                [
                    'Bubuk Red Velvet' => [25, 0.03],
                    'Susu UHT' => [200, 0.02],
                    'Gula Aren Cair' => [15, 0],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Iced Lemon Tea Segar',
                'Non-Kopi',
                16000,
                500,
                [
                    'Teh Hitam Celup / Daun' => [10, 0.02],
                    'Sirup Lemon' => [30, 0],
                    'Es Batu' => [120, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Lychee Tea with Real Fruit',
                'Non-Kopi',
                22000,
                1000,
                [
                    'Teh Hitam Celup / Daun' => [10, 0.02],
                    'Sirup Lychee' => [30, 0],
                    'Buah Leci Kaleng' => [40, 0.02],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Iced Milk Tea Gula Aren',
                'Non-Kopi',
                20000,
                1000,
                [
                    'Teh Hitam Celup / Daun' => [15, 0.02],
                    'Susu Evaporasi' => [50, 0],
                    'Gula Aren Cair' => [25, 0],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Matcha Strawberry Cloud',
                'Non-Kopi',
                28000,
                1500,
                [
                    'Matcha Powder' => [20, 0.05],
                    'Susu UHT' => [180, 0.02],
                    'Sirup Vanilla' => [15, 0],
                    'Es Batu' => [100, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],
            [
                'Thai Tea Creamy',
                'Non-Kopi',
                18000,
                1000,
                [
                    'Teh Hitam Celup / Daun' => [20, 0.02],
                    'Susu Kental Manis' => [35, 0],
                    'Susu Evaporasi' => [40, 0],
                    'Es Batu' => [120, 0],
                    'Cup + Lid' => [1, 0],
                ],
            ],

            // ==========================================
            // KATEGORI: MAKANAN (7 Menu)
            // ==========================================
            [
                'French Fries Gurih',
                'Makanan',
                18000,
                1000,
                [
                    'Kentang Goreng Shoestring' => [150, 0.05],
                    'Minyak Goreng' => [50, 0.1],
                    'Bumbu Tabur BBQ' => [10, 0],
                    'Saus Sambal & Tomat' => [20, 0],
                    'Plastik Mika / Paper Box' => [1, 0],
                ],
            ],
            [
                'Sosis Bakar Bratwurst',
                'Makanan',
                22000,
                1000,
                [
                    'Sosis Sapi Bratwurst' => [2, 0],
                    'Margarin / Mentega' => [15, 0],
                    'Saus Sambal & Tomat' => [25, 0],
                    'Plastik Mika / Paper Box' => [1, 0],
                ],
            ],
            [
                'Classic Beef Burger',
                'Makanan',
                32000,
                2000,
                [
                    'Roti Bun Burger' => [1, 0],
                    'Daging Patty Burger' => [1, 0],
                    'Keju Cheddar' => [20, 0],
                    'Margarin / Mentega' => [15, 0],
                    'Saus Sambal & Tomat' => [25, 0],
                    'Plastik Mika / Paper Box' => [1, 0],
                ],
            ],
            [
                'Roti Bakar Cokelat Keju',
                'Makanan',
                22000,
                1500,
                [
                    'Roti Tawar' => [2, 0],
                    'Selai Cokelat Nutella' => [30, 0],
                    'Keju Cheddar' => [25, 0],
                    'Margarin / Mentega' => [15, 0],
                    'Plastik Mika / Paper Box' => [1, 0],
                ],
            ],
            [
                'Butter Croissant',
                'Makanan',
                20000,
                1000,
                [
                    'Croissant Frozen / Dough' => [1, 0],
                    'Margarin / Mentega' => [10, 0],
                    'Plastik Mika / Paper Box' => [1, 0],
                ],
            ],
            [
                'Mix Platter Kentang & Sosis',
                'Makanan',
                28000,
                1500,
                [
                    'Kentang Goreng Shoestring' => [100, 0.05],
                    'Sosis Sapi Bratwurst' => [1, 0],
                    'Minyak Goreng' => [40, 0.1],
                    'Bumbu Tabur BBQ' => [10, 0],
                    'Saus Sambal & Tomat' => [30, 0],
                    'Plastik Mika / Paper Box' => [1, 0],
                ],
            ],
            [
                'Toast Cokelat Lumer',
                'Makanan',
                17000,
                1000,
                [
                    'Roti Tawar' => [2, 0],
                    'Selai Cokelat Nutella' => [35, 0],
                    'Margarin / Mentega' => [15, 0],
                    'Plastik Mika / Paper Box' => [1, 0],
                ],
            ],
        ];

        foreach ($definitions as [$name, $category, $price, $overhead, $bom]) {
            $menu = Menu::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();

            if (! $menu) {
                $menu = Menu::create([
                    'name' => $name,
                    'category' => $category,
                    'selling_price' => $price,
                    'overhead' => $overhead,
                    'is_active' => true,
                ]);
            } else {
                $menu->update([
                    'category' => $category,
                    'selling_price' => $price,
                    'overhead' => $overhead,
                    'is_active' => true,
                ]);
            }

            $recipe = Recipe::firstOrCreate(
                ['menu_id' => $menu->id],
                [
                    'yield_portions' => 1,
                    'notes' => 'Resep standar operasional kafe.',
                ]
            );

            foreach ($bom as $ingredientName => [$qty, $waste]) {
                if (! isset($ingredients[$ingredientName])) {
                    continue;
                }

                $ingredient = $ingredients[$ingredientName];

                RecipeIngredient::updateOrCreate(
                    [
                        'recipe_id' => $recipe->id,
                        'ingredient_id' => $ingredient->id,
                    ],
                    [
                        'quantity_needed' => $qty,
                        'waste_factor' => $waste,
                    ]
                );
            }

            // Hitung ulang dan simpan HPP, margin aktual, serta status profitabilitas
            $freshMenu = $menu->fresh();
            if ($freshMenu) {
                $costing->recalculateMenu($freshMenu);
            }
        }
    }
}
