<?php

namespace App\Http\Requests\Ingredient;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIngredientQuoteRequest extends FormRequest
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
            'quote_price' => ['required', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:50'],
        ];
    }
}
