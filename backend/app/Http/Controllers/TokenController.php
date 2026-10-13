<?php

declare(strict_types=1);
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
final class TokenController extends Controller
{
    public function index(Request $request): JsonResponse {
        $user = $request->user(); abort_unless($user instanceof User,401);
        return response()->json($user->tokens()->get(['id','name','abilities','last_used_at','expires_at']));
    }
    public function store(Request $request): JsonResponse {
        $user = $request->user(); abort_unless($user instanceof User,401);
        /** @var array{name:string,write:bool} $data */
        $data = $request->validate(['name'=>['required','string','max:80'],'write'=>['required','boolean']]);
        abort_if($user->tokens()->count() >= 20,422,'Limite de 20 conexões. Revogue uma conexão antes de continuar.');
        $token = $user->createToken($data['name'],$data['write'] ? ['vault:read','vault:write'] : ['vault:read'],now()->addDays(90));
        return response()->json(['token'=>$token->plainTextToken],201);
    }
    public function destroy(Request $request, string $id): JsonResponse {
        $user = $request->user(); abort_unless($user instanceof User,401);
        $user->tokens()->whereKey($id)->firstOrFail()->delete();
        return response()->json(['ok'=>true]);
    }
}