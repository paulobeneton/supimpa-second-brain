<?php

declare(strict_types=1);
namespace App\Http\Controllers;
use App\Http\Requests\AccountRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
final class AuthController extends Controller
{
    public function register(AccountRequest $request): JsonResponse {
        abort_unless(config('vault.registration') === true,403,'Novas contas são criadas pelo administrador.');
        /** @var array{name:string,email:string,password:string} $data */
        $data = $request->validated();
        $user = User::query()->create(['name'=>trim($data['name']),'email'=>strtolower($data['email']),'password'=>$data['password']]);
        Auth::guard('web')->login($user); $request->session()->regenerate();
        return response()->json($user,201);
    }
    public function login(AccountRequest $request): JsonResponse {
        /** @var array{email:string,password:string} $data */
        $data = $request->validated();
        if (!Auth::guard('web')->attempt(['email'=>strtolower($data['email']),'password'=>$data['password']])) { throw ValidationException::withMessages(['email'=>'E-mail ou senha inválidos.']); }
        $request->session()->regenerate();
        return response()->json($request->user());
    }
    public function me(Request $request): JsonResponse { return response()->json($request->user()); }
    public function logout(Request $request): JsonResponse {
        Auth::guard('web')->logout(); $request->session()->invalidate(); $request->session()->regenerateToken();
        return response()->json(['ok'=>true]);
    }
}