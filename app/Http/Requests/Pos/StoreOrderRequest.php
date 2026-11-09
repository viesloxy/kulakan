<?php

namespace App\Http\Requests\Pos;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // owner & staff boleh mencatat pesanan (SAD §9)
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.menu_id' => ['required', 'integer', 'exists:menus,id'],
            'lines.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'payment_method' => ['required', 'in:cash,qris'],
            'cash_received' => ['nullable', 'integer', 'min:0'],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'lines.required' => 'Belum ada item di pesanan.',
            'lines.*.quantity.min' => 'Kuantitas item minimal 1.',
            'payment_method.in' => 'Metode pembayaran tidak valid.',
        ];
    }
}
