<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::inertia('bahan-baku', 'ingredients')->name('ingredients');
    Route::inertia('menu', 'menus')->name('menus');
    Route::inertia('pos', 'pos')->name('pos');
    Route::inertia('profitabilitas', 'profitability')->name('profitability');
    Route::inertia('restock', 'restock')->name('restock');
    Route::inertia('alert', 'alerts')->name('alerts');
});

require __DIR__.'/settings.php';
