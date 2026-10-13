<?php

declare(strict_types=1);
namespace App\Http\Controllers;
use App\Http\Requests\SyncRequest;
use App\Models\User;
use App\Services\VaultService;
use Illuminate\Http\JsonResponse;
final class VaultController extends Controller
{
    public function __invoke(SyncRequest $request, VaultService $vault): JsonResponse {
        $user = $request->user(); abort_unless($user instanceof User,401);
        abort_if($request->hasHeader('X-Vault-User') && $request->header('X-Vault-User') !== (string)$user->id,409,'A conta da sessão mudou. Entre novamente com a conta deste cofre.');
        $mutations = $request->mutations();
        usort($mutations,fn($a,$b): int => ($a->kind === 'project' ? 0 : 1) <=> ($b->kind === 'project' ? 0 : 1));
        $results = [];
        foreach ($mutations as $mutation) { $results[] = $vault->mutate($user,$mutation); }
        return response()->json(['results'=>$results,'records'=>$vault->snapshot($user)]);
    }
}