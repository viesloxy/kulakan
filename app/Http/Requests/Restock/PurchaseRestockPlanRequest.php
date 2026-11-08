<?php

namespace App\Http\Requests\Restock;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseRestockPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // di-guard oleh middleware role:owner
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['nullable', 'array'],
            'items.*.ingredient_id' => ['required_with:items', 'exists:ingredients,id'],
            'items.*.purchased_packages' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'items.*.actual_package_price' => ['nullable', 'integer', 'min:0', 'max:1000000000'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
