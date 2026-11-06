<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Penjualan: sales_orders, sales_items (database-erd.md §4.6-4.7).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 20)->unique();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->integer('total_amount')->default(0);
            $table->string('payment_method', 10);
            $table->string('status', 10)->default('completed');
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->foreignId('reversal_of_id')->nullable()->constrained('sales_orders')->restrictOnDelete();
            $table->timestamps();
            $table->index('created_at');
        });
        DB::statement('ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_total_check CHECK (total_amount >= 0)');
        DB::statement("ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_payment_check CHECK (payment_method IN ('cash','qris'))");
        DB::statement("ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('completed','void'))");

        Schema::create('sales_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->restrictOnDelete();
            $table->foreignId('menu_id')->constrained('menus')->restrictOnDelete();
            $table->integer('quantity');
            $table->integer('unit_price');
            $table->decimal('unit_hpp_at_sale', 12, 2);
            $table->timestamps();
            $table->index('sales_order_id');
            $table->index('menu_id');
        });
        DB::statement('ALTER TABLE sales_items ADD CONSTRAINT sales_items_quantity_check CHECK (quantity BETWEEN 1 AND 999)');
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_items');
        Schema::dropIfExists('sales_orders');
    }
};
