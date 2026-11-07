<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kelola Pengguna: penonaktifan akun lewat soft delete (bukan hapus) agar
 * riwayat penjualan/ledger yang menaut user_id (FK restrict) tetap utuh
 * dan akun nonaktif otomatis tidak bisa login (global scope SoftDeletes).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
