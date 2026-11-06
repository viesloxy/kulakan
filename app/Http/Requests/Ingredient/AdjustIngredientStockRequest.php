<?php

namespace App\Http\Requests\Ingredient;

use Illuminate\Foundation\Http\FormRequest;

class AdjustIngredientStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:waste,adjustment'],
            'qty_change' => ['required', 'numeric', 'not_in:0'],
            'reason' => ['required', 'string', 'max:255'], // BR-011
        ];
    }
}
