<?php

declare(strict_types=1);
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
final class AccountRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    /** @return array<string, array<int, string|Password>> */
    public function rules(): array {
        $register = $this->is('api/register');
        $rules = ['email'=>['required','string','email','max:254'],'password'=>['required','string','max:200']];
        if ($register) { $rules['name'] = ['required','string','max:100']; $rules['email'][] = 'unique:users,email'; $rules['password'][] = 'confirmed'; $rules['password'][] = Password::min(12)->letters()->numbers(); }
        return $rules;
    }
}