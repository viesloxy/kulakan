<?php

namespace App\Http\Requests\Ingredient;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
            'qty_change' => ['required', 'numeric', 'not_in:0', 'between:-1000000,1000000'],
            'reason' => ['required', 'string', 'max:255'], // BR-011
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();
            $type = $this->input('type');
            $qty = (float) $this->input('qty_change');

            // Proteksi SEC-04: Staf hanya berhak mencatat waste, opname khusus owner
            if ($user?->role !== 'owner' && $type === 'adjustment') {
                $validator->errors()->add('type', 'Hanya pemilik (owner) yang berhak melakukan penyesuaian opname.');
            }

            // Waste harus bernilai negatif (pengurangan stok)
            if ($type === 'waste' && $qty > 0) {
                $validator->errors()->add('qty_change', 'Kuantitas waste harus bernilai negatif (pengurangan).');
            }

            // Validasi stok tidak boleh menjadi negatif
            $ingredient = $this->route('ingredient');
            if (! $ingredient instanceof Ingredient && $ingredient !== null) {
                $ingredient = Ingredient::find($ingredient);
            }

            if ($ingredient instanceof Ingredient && $qty < 0) {
                $newStock = bcadd((string) $ingredient->current_stock, (string) $this->input('qty_change'), 3);
                if (bccomp($newStock, '0', 3) < 0) {
                    $validator->errors()->add('qty_change', 'Pengurangan stok melebihi stok yang tersedia saat ini.');
                }
            }
        });
    }
}
