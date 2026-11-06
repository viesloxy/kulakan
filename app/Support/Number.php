<?php

namespace App\Support;

/**
 * Normalisasi nilai numerik menjadi numeric-string untuk bcmath.
 *
 * Eloquent mengembalikan kolom numeric sebagai string biasa; bcmath (dan stub PHPStan-nya)
 * menuntut numeric-string. Helper ini memvalidasi (bukan sekadar meng-cast) sehingga aman.
 */
final class Number
{
    /**
     * @return numeric-string
     */
    public static function str(mixed $value): string
    {
        if (! is_scalar($value)) {
            return '0';
        }

        $string = (string) $value;

        return is_numeric($string) ? $string : '0';
    }
}
