<?php

namespace App\Http\Requests\Menu;

use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
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
            'category' => ['required', 'in:Kopi,Non-Kopi,Makanan'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'selling_price' => ['required', 'integer', 'min:1'],
            'overhead' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Nama unik case-insensitive (BL §10).
     */
    private function uniqueName(): callable
    {
        return function (string $attribute, mixed $value, callable $fail): void {
            $query = Menu::whereRaw('lower(name) = lower(?)', [(string) $value]);

            if ($query->exists()) {
                $fail('Nama menu sudah digunakan.');
            }
        };
    }
}
