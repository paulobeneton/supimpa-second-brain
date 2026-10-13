<?php

declare(strict_types=1);
namespace App\Http\Requests;
use App\Data\MutationData;
use Illuminate\Foundation\Http\FormRequest;
final class SyncRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }
    /** @return array<string, list<string>> */
    public function rules(): array { return ['mutations'=>['present','array','max:100'],'mutations.*'=>['array'],'mutations.*.id'=>['required','uuid','distinct'],'mutations.*.operation_id'=>['required','uuid'],'mutations.*.kind'=>['required','string'],'mutations.*.base_version'=>['required','integer'],'mutations.*.data'=>['required','array'],'mutations.*.deleted'=>['required','boolean']]; }
    /** @return list<MutationData> */
    public function mutations(): array {
        /** @var list<array<string,mixed>> $items */
        $items = $this->validated('mutations');
        return array_map(fn(array $item): MutationData => MutationData::fromArray($item), $items);
    }
}