<?php

declare(strict_types=1);
namespace App\Services;
use App\Data\MutationData;
use App\Models\SyncReceipt;
use App\Models\User;
use App\Models\VaultRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
final class VaultService
{
    /** @return array<string, mixed> */
    public function mutate(User $user, MutationData $mutation): array {
        return DB::transaction(function () use ($user,$mutation): array {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $receipt = SyncReceipt::query()->where('owner_id',$user->id)->where('operation_id',$mutation->operationId)->first();
            if ($receipt) { return $receipt->result; }
            $record = VaultRecord::query()->where('owner_id',$user->id)->where('uid',$mutation->id)->first();
            if ($record && $record->kind !== $mutation->kind) { throw ValidationException::withMessages(['kind'=>'O tipo do registro não pode mudar.']); }
            if (($record ? $record->version : 0) !== $mutation->baseVersion) {
                return ['operation_id'=>$mutation->operationId,'status'=>'conflict','record'=>$record?->payload() ?? ['id'=>$mutation->id,'kind'=>$mutation->kind,'data'=>$mutation->data,'version'=>0,'deleted'=>true]];
            }
            if (!$record && VaultRecord::query()->where('owner_id',$user->id)->count() >= 5000) { throw ValidationException::withMessages(['vault'=>'Limite de 5.000 registros por cofre. Exporte um backup e entre em contato com o administrador.']); }
            $data = $mutation->data;
            if ($mutation->kind === 'task' && !empty($data['project_id'])) {
                $exists = VaultRecord::query()->where('owner_id',$user->id)->where('uid',$data['project_id'])->where('kind','project')->exists();
                if (!$exists) { throw ValidationException::withMessages(['project_id'=>'Projeto não encontrado neste cofre.']); }
            }
            $record ??= new VaultRecord(['owner_id'=>$user->id,'uid'=>$mutation->id,'kind'=>$mutation->kind]);
            $record->fill(['data'=>$data,'version'=>$mutation->baseVersion+1,'deleted'=>$mutation->deleted])->save();
            if ($record->kind === 'note') {
                DB::table('note_links')->where('owner_id',$user->id)->where('source_uid',$record->uid)->delete();
                if (!$record->deleted) {
                    $md = is_string($data['md'] ?? null) ? $data['md'] : '';
                    preg_match_all('/\[\[([^\]]{1,200})\]\]/u',$md,$matches);
                    foreach (array_unique($matches[1]) as $title) { DB::table('note_links')->insert(['owner_id'=>$user->id,'source_uid'=>$record->uid,'target_title'=>trim($title)]); }
                }
            }
            $result = ['operation_id'=>$mutation->operationId,'status'=>'accepted','record'=>$record->fresh()?->payload() ?? $record->payload()];
            SyncReceipt::query()->create(['owner_id'=>$user->id,'operation_id'=>$mutation->operationId,'result'=>$result]);
            return $result;
        }, 3);
    }
    /** @return list<array{id:string,kind:string,data:array<string,mixed>,version:int,deleted:bool,updated_at:string}> */
    public function snapshot(User $user): array {
        return array_values(VaultRecord::query()->where('owner_id',$user->id)->orderBy('id')->get()->map(fn(VaultRecord $r): array => $r->payload())->all());
    }
}