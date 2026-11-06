<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Modul khusus Owner (matriks akses SAD §9 - staff menerima 403).
    Route::middleware('role:owner')->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
        Route::inertia('profitabilitas', 'profitability')->name('profitability');
        Route::inertia('restock', 'restock')->name('restock');
        Route::inertia('alert', 'alerts')->name('alerts');
    });

    // Modul untuk Owner & Staff.
    Route::inertia('bahan-baku', 'ingredients')->name('ingredients');
    Route::inertia('menu', 'menus')->name('menus');
    Route::inertia('pos', 'pos')->name('pos');
});

require __DIR__.'/settings.php';
