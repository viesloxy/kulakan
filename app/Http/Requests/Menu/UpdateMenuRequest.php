<?php

namespace App\Http\Requests\Menu;

use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuRequest extends FormRequest
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
            'category' => ['required', 'in:Kopi,Non-Kopi,Makanan'],
            'selling_price' => ['required', 'integer', 'min:1'],
            'overhead' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    private function uniqueName(): callable
    {
        return function (string $attribute, mixed $value, callable $fail): void {
            /** @var Menu $menu */
            $menu = $this->route('menu');

            $exists = Menu::whereRaw('lower(name) = lower(?)', [(string) $value])
                ->whereKeyNot($menu->id)
                ->exists();

            if ($exists) {
                $fail('Nama menu sudah digunakan.');
            }
        };
    }
}
