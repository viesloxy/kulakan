<?php

use App\Http\Controllers\IngredientController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Modul khusus Owner (matriks akses SAD §9 - staff menerima 403).
    Route::middleware('role:owner')->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
        Route::inertia('profitabilitas', 'profitability')->name('profitability');
        Route::inertia('restock', 'restock')->name('restock');
        Route::inertia('alert', 'alerts')->name('alerts');

        // Mutasi bahan baku khusus owner (FR-004/006/008).
        Route::post('bahan-baku', [IngredientController::class, 'store'])->name('ingredients.store');
        Route::put('bahan-baku/{ingredient}', [IngredientController::class, 'update'])->name('ingredients.update');
        Route::delete('bahan-baku/{ingredient}', [IngredientController::class, 'destroy'])->name('ingredients.destroy');
        Route::post('bahan-baku/{ingredient}/stock-in', [IngredientController::class, 'stockIn'])->name('ingredients.stock-in');
        Route::post('bahan-baku/{ingredient}/quote', [IngredientController::class, 'quote'])->name('ingredients.quote');
    });

    // Baca bahan baku: owner & staff.
    Route::get('bahan-baku', [IngredientController::class, 'index'])->name('ingredients');

    // Penyesuaian/waste: owner & staff (FR-007).
    Route::post('bahan-baku/{ingredient}/adjustments', [IngredientController::class, 'adjustments'])->name('ingredients.adjustments');

    // Modul untuk Owner & Staff.
    Route::inertia('menu', 'menus')->name('menus');
    Route::inertia('pos', 'pos')->name('pos');
});

require __DIR__.'/settings.php';
