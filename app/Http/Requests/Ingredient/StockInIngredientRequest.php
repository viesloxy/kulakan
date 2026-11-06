<?php

namespace App\Http\Requests\Ingredient;

use Illuminate\Foundation\Http\FormRequest;

class StockInIngredientRequest extends FormRequest
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
            'packages' => ['required_without:quantity_base', 'nullable', 'integer', 'min:1'],
            'price_per_package' => ['required_without:unit_price_base', 'nullable', 'numeric', 'min:0'],
            'quantity_base' => ['required_without:packages', 'nullable', 'numeric', 'gt:0'],
            'unit_price_base' => ['required_without:price_per_package', 'nullable', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:50'],
            'supplier' => ['nullable', 'string', 'max:100'],
        ];
    }
}
