<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Restock: restock_plans, restock_plan_items (database-erd.md §4.10-4.11).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restock_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->integer('cash_amount');
            $table->integer('total_cost')->default(0);
            $table->integer('remaining_cash');
            $table->string('status', 10)->default('draft');
            $table->timestamp('purchased_at', 0)->nullable();
            $table->timestamps();
        });
        DB::statement('ALTER TABLE restock_plans ADD CONSTRAINT restock_plans_cash_check CHECK (cash_amount >= 0)');
        DB::statement('ALTER TABLE restock_plans ADD CONSTRAINT restock_plans_total_check CHECK (total_cost >= 0)');
        DB::statement('ALTER TABLE restock_plans ADD CONSTRAINT restock_plans_remaining_check CHECK (remaining_cash >= 0)');
        DB::statement('ALTER TABLE restock_plans ADD CONSTRAINT restock_plans_budget_invariant CHECK (total_cost <= cash_amount)');
        DB::statement("ALTER TABLE restock_plans ADD CONSTRAINT restock_plans_status_check CHECK (status IN ('draft','approved','purchased'))");

        Schema::create('restock_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restock_plan_id')->constrained('restock_plans')->restrictOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->restrictOnDelete();
            $table->decimal('urgency', 10, 4)->nullable();
            $table->boolean('is_urgent')->default(false);
            $table->string('abc_class', 1)->nullable();
            $table->decimal('priority_score', 10, 4)->nullable();
            $table->integer('qmin_packages')->default(0);
            $table->integer('qtarget_packages')->default(0);
            $table->integer('recommended_packages')->default(0);
            $table->integer('estimated_cost')->default(0);
            $table->string('label', 30)->nullable();
            $table->integer('purchased_packages')->nullable();
            $table->timestamps();
            $table->unique(['restock_plan_id', 'ingredient_id']);
        });
        DB::statement("ALTER TABLE restock_plan_items ADD CONSTRAINT restock_plan_items_abc_check CHECK (abc_class IS NULL OR abc_class IN ('A','B','C'))");
        DB::statement('ALTER TABLE restock_plan_items ADD CONSTRAINT restock_plan_items_qmin_check CHECK (qmin_packages >= 0)');
        DB::statement('ALTER TABLE restock_plan_items ADD CONSTRAINT restock_plan_items_qtarget_check CHECK (qtarget_packages >= 0)');
        DB::statement('ALTER TABLE restock_plan_items ADD CONSTRAINT restock_plan_items_recommended_check CHECK (recommended_packages >= 0)');
        DB::statement("ALTER TABLE restock_plan_items ADD CONSTRAINT restock_plan_items_label_check CHECK (label IS NULL OR label IN ('beli_sekarang','beli_sekarang_parsial','beli_opsional','tahan_dulu','kas_tidak_cukup'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('restock_plan_items');
        Schema::dropIfExists('restock_plans');
    }
};
