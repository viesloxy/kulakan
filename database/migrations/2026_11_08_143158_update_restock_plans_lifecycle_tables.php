<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $pgsql = DB::getDriverName() === 'pgsql';

        Schema::table('restock_plans', function (Blueprint $table) {
            $table->timestamp('approved_at')->nullable()->after('status');
            $table->timestamp('ordered_at')->nullable()->after('approved_at');
            $table->timestamp('cancelled_at')->nullable()->after('purchased_at');
            $table->string('cancellation_reason')->nullable()->after('cancelled_at');
            $table->text('notes')->nullable()->after('cancellation_reason');
            $table->integer('actual_cost')->nullable()->after('total_cost');
        });

        if ($pgsql) {
            DB::statement('ALTER TABLE restock_plans DROP CONSTRAINT IF EXISTS restock_plans_status_check');
            DB::statement("ALTER TABLE restock_plans ADD CONSTRAINT restock_plans_status_check CHECK (status IN ('draft','approved','ordered','purchased','cancelled'))");
        }

        Schema::table('restock_plan_items', function (Blueprint $table) {
            $table->integer('actual_cost')->nullable()->after('estimated_cost');
            $table->string('notes')->nullable()->after('label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $pgsql = DB::getDriverName() === 'pgsql';

        Schema::table('restock_plan_items', function (Blueprint $table) {
            $table->dropColumn(['actual_cost', 'notes']);
        });

        if ($pgsql) {
            DB::statement('ALTER TABLE restock_plans DROP CONSTRAINT IF EXISTS restock_plans_status_check');
            DB::statement("ALTER TABLE restock_plans ADD CONSTRAINT restock_plans_status_check CHECK (status IN ('draft','approved','purchased'))");
        }

        Schema::table('restock_plans', function (Blueprint $table) {
            $table->dropColumn([
                'approved_at',
                'ordered_at',
                'cancelled_at',
                'cancellation_reason',
                'notes',
                'actual_cost',
            ]);
        });
    }
};
