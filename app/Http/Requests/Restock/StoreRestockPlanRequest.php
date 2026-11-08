<?php

namespace App\Http\Requests\Restock;

use Illuminate\Foundation\Http\FormRequest;

class StoreRestockPlanRequest extends FormRequest
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
            'cash_amount' => ['required', 'integer', 'min:0'],
            'max_days_lead_time' => ['nullable', 'integer', 'min:0', 'max:365'],
            'delivery_date' => ['nullable', 'string', 'max:50'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'payment_terms' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'in:draft,approved,ordered'],
            'items' => ['nullable', 'array'],
            'items.*.ingredient_id' => ['required_with:items', 'exists:ingredients,id'],
            'items.*.recommended_packages' => ['required_with:items', 'integer', 'min:0'],
            'items.*.estimated_cost' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cash_amount.required' => 'Kas tersedia wajib diisi.',
            'cash_amount.min' => 'Kas tidak boleh negatif.',
        ];
    }
}
