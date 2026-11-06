<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Katalog: ingredients, menus, recipes, recipe_ingredients (database-erd.md §4.2-4.5).
 *
 * CHECK constraint, unique case-insensitive, dan index expression bersifat PostgreSQL-only;
 * dibungkus guard agar test (SQLite) tetap berjalan.
 */
return new class extends Migration
{
    public function up(): void
    {
        $pgsql = DB::getDriverName() === 'pgsql';

        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('base_unit', 10); // 'gram' butuh 4 char (ERD menulis varchar(3) - dikoreksi)
            $table->decimal('current_stock', 14, 3)->default(0);
            $table->decimal('minimum_stock', 14, 3)->default(0);
            $table->decimal('cost_per_unit', 14, 4)->default(0);
            $table->decimal('last_quote_price', 14, 4)->nullable();
            $table->timestamp('last_quote_at')->nullable();
            $table->integer('lead_time_days')->default(0);
            $table->integer('review_period_days')->default(2);
            $table->decimal('package_size', 14, 3)->nullable();
            $table->integer('package_price')->nullable();
            $table->integer('moq_packages')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        if ($pgsql) {
            DB::statement('CREATE UNIQUE INDEX ingredients_name_lower_unique ON ingredients (lower(name))');
            DB::statement('CREATE INDEX ingredients_is_active_index ON ingredients (is_active)');
            DB::statement("ALTER TABLE ingredients ADD CONSTRAINT ingredients_base_unit_check CHECK (base_unit IN ('gram','ml','pcs'))");
            DB::statement('ALTER TABLE ingredients ADD CONSTRAINT ingredients_current_stock_check CHECK (current_stock >= 0)');
            DB::statement('ALTER TABLE ingredients ADD CONSTRAINT ingredients_minimum_stock_check CHECK (minimum_stock >= 0)');
            DB::statement('ALTER TABLE ingredients ADD CONSTRAINT ingredients_moq_check CHECK (moq_packages >= 1)');
        }

        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('category', 50)->nullable();
            $table->integer('selling_price');
            $table->integer('overhead')->default(0);
            $table->decimal('current_hpp', 12, 2)->default(0);
            $table->decimal('margin_pct', 5, 2)->default(0);
            $table->string('status', 20)->default('profitable');
            $table->decimal('projected_hpp', 12, 2)->nullable();
            $table->decimal('projected_margin_pct', 5, 2)->nullable();
            $table->string('projected_status', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        if ($pgsql) {
            DB::statement('CREATE UNIQUE INDEX menus_name_lower_unique ON menus (lower(name))');
            DB::statement('CREATE INDEX menus_is_active_status_index ON menus (is_active, status)');
            DB::statement('ALTER TABLE menus ADD CONSTRAINT menus_selling_price_check CHECK (selling_price > 0)');
            DB::statement('ALTER TABLE menus ADD CONSTRAINT menus_overhead_check CHECK (overhead >= 0)');
            DB::statement("ALTER TABLE menus ADD CONSTRAINT menus_status_check CHECK (status IN ('profitable','watchlist','loss'))");
            DB::statement("ALTER TABLE menus ADD CONSTRAINT menus_projected_status_check CHECK (projected_status IS NULL OR projected_status IN ('profitable','watchlist','loss'))");
        }

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->unique()->constrained('menus')->restrictOnDelete();
            $table->integer('yield_portions')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        if ($pgsql) {
            DB::statement('ALTER TABLE recipes ADD CONSTRAINT recipes_yield_check CHECK (yield_portions >= 1)');
        }

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->restrictOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->restrictOnDelete();
            $table->decimal('quantity_needed', 14, 3);
            $table->decimal('waste_factor', 4, 3)->default(0);
            $table->timestamps();
            $table->unique(['recipe_id', 'ingredient_id']);
            $table->index('ingredient_id');
        });
        if ($pgsql) {
            DB::statement('ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_qty_check CHECK (quantity_needed > 0)');
            DB::statement('ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_waste_check CHECK (waste_factor >= 0 AND waste_factor <= 0.5)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('ingredients');
    }
};
