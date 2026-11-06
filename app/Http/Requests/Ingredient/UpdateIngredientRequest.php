<?php

namespace App\Http\Requests\Ingredient;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateIngredientRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100', $this->uniqueName()],
            'minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'lead_time_days' => ['nullable', 'integer', 'min:0'],
            'review_period_days' => ['nullable', 'integer', 'min:0'],
            'package_size' => ['nullable', 'numeric', 'min:0'],
            'package_price' => ['nullable', 'integer', 'min:0'],
            'moq_packages' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator): void {
            /** @var Ingredient $ingredient */
            $ingredient = $this->route('ingredient');

            // base_unit tidak boleh berubah bila sudah ada pergerakan stok (FR-004, BL §10).
            if ($this->filled('base_unit') && $this->input('base_unit') !== $ingredient->base_unit
                && $ingredient->stockMovements()->exists()) {
                $validator->errors()->add('base_unit', 'Satuan dasar tidak dapat diubah karena sudah ada pergerakan stok.');
            }
        });
    }

    private function uniqueName(): callable
    {
        return function (string $attribute, mixed $value, callable $fail): void {
            /** @var Ingredient $ingredient */
            $ingredient = $this->route('ingredient');

            $exists = Ingredient::whereRaw('lower(name) = lower(?)', [(string) $value])
                ->whereKeyNot($ingredient->id)
                ->exists();

            if ($exists) {
                $fail('Nama bahan sudah digunakan.');
            }
        };
    }
}
