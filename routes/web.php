<?php

use App\Http\Controllers\IngredientController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfitabilityController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Modul khusus Owner (matriks akses SAD §9 - staff menerima 403).
    Route::middleware('role:owner')->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
        Route::get('profitabilitas', [ProfitabilityController::class, 'index'])->name('profitability');
        Route::inertia('restock', 'restock')->name('restock');
        Route::inertia('alert', 'alerts')->name('alerts');

        // Mutasi bahan baku khusus owner (FR-004/006/008).
        Route::post('bahan-baku', [IngredientController::class, 'store'])->name('ingredients.store');
        Route::put('bahan-baku/{ingredient}', [IngredientController::class, 'update'])->name('ingredients.update');
        Route::delete('bahan-baku/{ingredient}', [IngredientController::class, 'destroy'])->name('ingredients.destroy');
        Route::post('bahan-baku/{ingredient}/stock-in', [IngredientController::class, 'stockIn'])->name('ingredients.stock-in');
        Route::post('bahan-baku/{ingredient}/quote', [IngredientController::class, 'quote'])->name('ingredients.quote');

        // Mutasi menu & resep khusus owner (FR-011/012).
        Route::post('menu', [MenuController::class, 'store'])->name('menus.store');
        Route::put('menu/{menu}', [MenuController::class, 'update'])->name('menus.update');
        Route::delete('menu/{menu}', [MenuController::class, 'destroy'])->name('menus.destroy');
        Route::post('menu/{menu}/recipe', [MenuController::class, 'saveRecipe'])->name('menus.recipe');
    });

    // Baca bahan baku: owner & staff.
    Route::get('bahan-baku', [IngredientController::class, 'index'])->name('ingredients');

    // Penyesuaian/waste: owner & staff (FR-007).
    Route::post('bahan-baku/{ingredient}/adjustments', [IngredientController::class, 'adjustments'])->name('ingredients.adjustments');

    // Baca menu: owner & staff.
    Route::get('menu', [MenuController::class, 'index'])->name('menus');

    // POS kasir: owner & staff (FR-013-017).
    Route::get('pos', [OrderController::class, 'index'])->name('pos');
    Route::post('pos', [OrderController::class, 'store'])->name('pos.store');
});

require __DIR__.'/settings.php';
