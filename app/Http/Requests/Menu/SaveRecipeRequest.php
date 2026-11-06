<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class SaveRecipeRequest extends FormRequest
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
            'yield_portions' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.ingredient_id' => ['required', 'integer', 'distinct', 'exists:ingredients,id'],
            'items.*.quantity_needed' => ['required', 'numeric', 'gt:0'],
            'items.*.waste_factor' => ['nullable', 'numeric', 'min:0', 'max:0.5'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Resep minimal berisi satu bahan.',
            'items.*.ingredient_id.distinct' => 'Bahan yang sama tidak boleh muncul dua kali dalam satu resep.',
            'items.*.quantity_needed.gt' => 'Kuantitas bahan harus lebih dari 0.',
            'items.*.waste_factor.max' => 'Waste factor tidak boleh melebihi 50%.',
        ];
    }
}
