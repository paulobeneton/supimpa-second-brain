<?php

declare(strict_types=1);
namespace App\Data;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
final readonly class MutationData
{
    /** @param array<string, mixed> $data */
    public function __construct(public string $operationId, public string $id, public string $kind, public int $baseVersion, public array $data, public bool $deleted) {}
    /** @param array<string, mixed> $input */
    public static function fromArray(array $input): self {
        /** @var array{operation_id:string,id:string,kind:string,base_version:int,data:array<string,mixed>,deleted:bool} $value */
        $value = Validator::make($input, [
            'operation_id'=>['required','uuid'], 'id'=>['required','uuid'], 'kind'=>['required',Rule::in(['note','task','project'])],
            'base_version'=>['required','integer','min:0'], 'data'=>['required','array'], 'deleted'=>['required','boolean'],
        ])->validate();
        $rules = match ($value['kind']) {
            'note' => ['title'=>['present','string','max:200'], 'md'=>['present','string','max:200000'], 'folder'=>['required',Rule::in(['Inbox','Projetos','Sistema','Diário'])], 'tags'=>['present','array','max:20'], 'tags.*'=>['string','max:60']],
            'task' => ['title'=>['required','string','max:200'], 'project_id'=>['present','nullable','string','max:36'], 'status'=>['required',Rule::in(['todo','doing','review','done'])], 'due'=>['present','nullable','date_format:Y-m-d'], 'subtasks'=>['present','array','max:100'], 'subtasks.*.title'=>['required','string','max:200'], 'subtasks.*.done'=>['required','boolean']],
            default => ['title'=>['required','string','max:200'], 'client'=>['present','string','max:200'], 'color'=>['required','regex:/^#[0-9a-fA-F]{6}$/'], 'due'=>['present','nullable','date_format:Y-m-d']],
        };
        $data = $value['data'];
        if (array_key_exists('due',$data) && $data['due'] === '') { $data['due'] = null; }
        if (array_key_exists('project_id',$data) && $data['project_id'] === '') { $data['project_id'] = null; }
        /** @var array<string, mixed> $validated */
        $validated = Validator::make($data,$rules)->validate();
        return new self($value['operation_id'],$value['id'],$value['kind'],(int)$value['base_version'],$validated,(bool)$value['deleted']);
    }
}