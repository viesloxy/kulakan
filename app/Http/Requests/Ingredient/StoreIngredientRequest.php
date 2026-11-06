<?php

namespace App\Http\Requests\Ingredient;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;

class StoreIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // dibatasi oleh middleware role:owner
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', $this->uniqueName()],
            'base_unit' => ['required', 'in:gram,ml,pcs'],
            'minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'lead_time_days' => ['nullable', 'integer', 'min:0'],
            'review_period_days' => ['nullable', 'integer', 'min:0'],
            'package_size' => ['nullable', 'numeric', 'min:0'],
            'package_price' => ['nullable', 'integer', 'min:0'],
            'moq_packages' => ['nullable', 'integer', 'min:1'],
            'cost_per_unit' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Nama unik case-insensitive (BL §10).
     */
    private function uniqueName(): callable
    {
        return function (string $attribute, mixed $value, callable $fail): void {
            $query = Ingredient::whereRaw('lower(name) = lower(?)', [(string) $value]);

            if ($query->exists()) {
                $fail('Nama bahan sudah digunakan.');
            }
        };
    }
}
