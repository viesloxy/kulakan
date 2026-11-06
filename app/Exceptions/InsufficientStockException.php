<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Dilempar saat stok bahan tidak mencukupi untuk sebuah pesanan (FR-015, BR-032).
 * Seluruh pesanan ditolak; tidak ada perubahan stok.
 */
class InsufficientStockException extends RuntimeException
{
    /**
     * @param  array<int, array{ingredient_id:int, name:string, needed:string, available:string, shortage:string}>  $shortages
     */
    public function __construct(public readonly array $shortages)
    {
        parent::__construct('Stok bahan tidak mencukupi. Pesanan tidak disimpan.');
    }
}
