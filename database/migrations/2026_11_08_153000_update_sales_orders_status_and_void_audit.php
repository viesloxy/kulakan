<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $pgsql = DB::getDriverName() === 'pgsql';

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->string('status', 15)->default('preparing')->change();
            $table->string('void_reason', 255)->nullable()->after('status');
            $table->string('void_type', 20)->nullable()->after('void_reason');
            $table->timestamp('voided_at')->nullable()->after('void_type');
            $table->foreignId('voided_by')->nullable()->after('voided_at')->constrained('users')->nullOnDelete();
        });

        if ($pgsql) {
            DB::statement('ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check');
            DB::statement("ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('preparing', 'ready', 'completed', 'void'))");
            DB::statement("ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_void_type_check CHECK (void_type IS NULL OR void_type IN ('restored', 'wasted'))");
        }
    }

    public function down(): void
    {
        $pgsql = DB::getDriverName() === 'pgsql';

        if ($pgsql) {
            DB::statement('ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_void_type_check');
            DB::statement('ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check');
            DB::statement("ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('completed', 'void'))");
        }

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropForeign(['voided_by']);
            $table->dropColumn(['void_reason', 'void_type', 'voided_at', 'voided_by']);
            $table->string('status', 10)->default('completed')->change();
        });
    }
};
