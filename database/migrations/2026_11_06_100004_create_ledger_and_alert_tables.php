<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ledger & alert: stock_movements, price_histories, alerts (database-erd.md §4.8-4.9, 4.12).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->restrictOnDelete();
            $table->string('type', 20);
            $table->decimal('qty_change', 14, 3);
            $table->decimal('unit_price', 14, 4)->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('sales_order_id')->nullable()->constrained('sales_orders')->restrictOnDelete();
            $table->foreignId('restock_plan_item_id')->nullable()->constrained('restock_plan_items')->restrictOnDelete();
            // Append-only: hanya created_at, tanpa updated_at.
            $table->timestamp('created_at', 0)->useCurrent();
            $table->index(['ingredient_id', 'created_at']);
            $table->index('sales_order_id');
        });
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_type_check CHECK (type IN ('purchase','sale','waste','adjustment','sale_reversal'))");
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_reason_check CHECK (type NOT IN ('waste','adjustment') OR reason IS NOT NULL)");

        Schema::create('price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->restrictOnDelete();
            $table->string('type', 10);
            $table->decimal('old_value', 14, 4)->nullable();
            $table->decimal('new_value', 14, 4);
            $table->string('reason', 50)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['ingredient_id', 'created_at']);
        });
        DB::statement("ALTER TABLE price_histories ADD CONSTRAINT price_histories_type_check CHECK (type IN ('purchase','quote'))");

        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);
            $table->string('subject_type', 20);
            $table->unsignedBigInteger('subject_id');
            $table->string('status', 10)->default('active');
            $table->jsonb('payload')->nullable();
            $table->timestamp('resolved_at', 0)->nullable();
            $table->timestamps();
        });
        DB::statement("CREATE UNIQUE INDEX alerts_active_unique ON alerts (type, subject_type, subject_id) WHERE status = 'active'");
        DB::statement("ALTER TABLE alerts ADD CONSTRAINT alerts_type_check CHECK (type IN ('low_stock','margin_drop','price_hike'))");
        DB::statement("ALTER TABLE alerts ADD CONSTRAINT alerts_subject_check CHECK (subject_type IN ('ingredient','menu'))");
        DB::statement("ALTER TABLE alerts ADD CONSTRAINT alerts_status_check CHECK (status IN ('active','resolved'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('price_histories');
        Schema::dropIfExists('stock_movements');
    }
};
