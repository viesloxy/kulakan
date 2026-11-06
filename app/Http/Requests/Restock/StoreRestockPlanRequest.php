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
