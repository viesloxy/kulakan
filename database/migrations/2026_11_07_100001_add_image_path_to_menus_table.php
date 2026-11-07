<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gambar menu untuk katalog & POS (kolom tunggal, bukan tabel terpisah;
 * 1 foto per menu cukup untuk MVP - lihat docs/consultation-review-2026-11-07.md §3.1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
