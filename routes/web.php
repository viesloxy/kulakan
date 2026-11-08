<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfitabilityController;
use App\Http\Controllers\RestockController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Modul khusus Owner (matriks akses SAD §9 - staff menerima 403).
    Route::middleware('role:owner')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('profitabilitas', [ProfitabilityController::class, 'index'])->name('profitability');
        Route::get('restock', [RestockController::class, 'index'])->name('restock');
        Route::post('restock/plans', [RestockController::class, 'store'])->middleware('throttle:30,1')->name('restock.store');
        Route::post('restock/plans/{restockPlan}/purchase', [RestockController::class, 'purchase'])->middleware('throttle:30,1')->name('restock.purchase');
        Route::get('alert', [AlertController::class, 'index'])->name('alerts');
        Route::post('alert/{alert}/resolve', [AlertController::class, 'resolve'])->name('alerts.resolve');

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

        // Void pesanan khusus owner (FR-018, DEC-13).
        Route::post('pos/{salesOrder}/void', [OrderController::class, 'void'])->middleware('throttle:30,1')->name('orders.void');

        // Kelola pengguna: multi-owner & staff dalam 1 UMKM (matriks SAD §9).
        Route::get('pengguna', [UserController::class, 'index'])->name('pengguna');
        Route::post('pengguna', [UserController::class, 'store'])->name('pengguna.store');
        Route::put('pengguna/{user}', [UserController::class, 'update'])->name('pengguna.update');
        Route::delete('pengguna/{user}', [UserController::class, 'destroy'])->name('pengguna.destroy');
        Route::post('pengguna/{userId}/restore', [UserController::class, 'restore'])->name('pengguna.restore');
    });

    // Baca bahan baku: owner & staff.
    Route::get('bahan-baku', [IngredientController::class, 'index'])->name('ingredients');

    // Penyesuaian/waste: owner & staff (FR-007).
    Route::post('bahan-baku/{ingredient}/adjustments', [IngredientController::class, 'adjustments'])
        ->middleware('throttle:30,1')
        ->name('ingredients.adjustments');

    // Baca menu: owner & staff.
    Route::get('menu', [MenuController::class, 'index'])->name('menus');

    // POS kasir: owner & staff (FR-013-017).
    Route::get('pos', [OrderController::class, 'index'])->name('pos');
    Route::post('pos', [OrderController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('pos.store');
});

require __DIR__.'/settings.php';
