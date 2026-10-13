<?php

declare(strict_types=1);
namespace App\Mcp\Tools;
use App\Data\MutationData;
use App\Models\User;
use App\Models\VaultRecord;
use App\Services\VaultService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
#[Name('vault')]
#[Description('Search, read, create or update Markdown notes in the authenticated personal vault. Search returns up to 50 results with an offset for pagination. Writes require vault:write and optimistic version checks.')]
final class VaultTool extends Tool
{
    public function handle(Request $request, VaultService $vault): Response {
        $user = $request->user();
        if (!$user instanceof User || !$user->tokenCan('vault:read')) { return Response::error('Acesso negado.'); }
        /** @var array{action:string,query?:string,id?:string,title?:string,md?:string,version?:int,operation_id?:string,offset?:int} $args */
        $args = $request->validate(['action'=>'required|in:search,read,create,update','query'=>'sometimes|string|max:200','id'=>'sometimes|uuid','title'=>'sometimes|string|max:200','md'=>'sometimes|string|max:200000','version'=>'sometimes|integer|min:1','operation_id'=>'sometimes|uuid','offset'=>'sometimes|integer|min:0|max:5000']);
        $query = VaultRecord::query()->where('owner_id',$user->id)->where('kind','note')->where('deleted',false);
        if ($args['action'] === 'search') {
            $term = mb_strtolower($args['query'] ?? '');
            $matches = $query->get()->filter(function(VaultRecord $record) use($term): bool {
                $title = is_string($record->data['title'] ?? null) ? $record->data['title'] : '';
                $md = is_string($record->data['md'] ?? null) ? $record->data['md'] : '';
                return str_contains(mb_strtolower($title.' '.$md),$term);
            });
            return Response::json(['total'=>$matches->count(),'notes'=>$matches->slice($args['offset'] ?? 0,50)->map(fn(VaultRecord $r): array => ['id'=>$r->uid,'title'=>$r->data['title'] ?? '', 'version'=>$r->version])->values()->all()]);
        }
        if ($args['action'] === 'read') {
            $record = $query->where('uid',$args['id'] ?? '')->first();
            return $record ? Response::json($record->payload()) : Response::error('Nota não encontrada.');
        }
        if (!$user->tokenCan('vault:write')) { return Response::error('Token sem permissão de escrita.'); }
        $record = $args['action'] === 'update' ? $query->where('uid',$args['id'] ?? '')->first() : null;
        if ($args['action'] === 'update' && (!$record || !isset($args['version']))) { return Response::error('Informe o id e a versão atual de uma nota existente.'); }
        try {
            $data = array_merge($record ? $record->data : ['title'=>'','md'=>'','folder'=>'Inbox','tags'=>[]],array_intersect_key($args,array_flip(['title','md'])));
            $mutation = MutationData::fromArray(['operation_id'=>$args['operation_id'] ?? (string)Str::uuid(),'id'=>$record ? $record->uid : ($args['id'] ?? (string)Str::uuid()),'kind'=>'note','base_version'=>$record ? $args['version'] : 0,'data'=>$data,'deleted'=>false]);
            return Response::json($vault->mutate($user,$mutation));
        } catch (ValidationException $e) { return Response::error($e->getMessage()); }
    }
    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array {
        return ['action'=>$schema->string()->enum(['search','read','create','update'])->required(), 'query'=>$schema->string(), 'id'=>$schema->string()->description('Note UUID. Supply on create for retry safety.'), 'title'=>$schema->string(), 'md'=>$schema->string(), 'version'=>$schema->integer()->description('Current version, required for updates.'), 'operation_id'=>$schema->string()->description('Reuse this UUID when retrying the same write.'), 'offset'=>$schema->integer()];
    }
}