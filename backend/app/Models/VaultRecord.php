<?php

declare(strict_types=1);
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
/**
 * @property int $id
 * @property int $owner_id
 * @property string $uid
 * @property string $kind
 * @property array<string, mixed> $data
 * @property int $version
 * @property bool $deleted
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class VaultRecord extends Model
{
    /** @use HasFactory<\Database\Factories\VaultRecordFactory> */
    use HasFactory;
    protected $guarded = ['id'];
    /** @return array<string, string> */
    protected function casts(): array { return ['data' => 'array', 'version' => 'integer', 'deleted' => 'boolean']; }
    /** @return array{id: string, kind: string, data: array<string, mixed>, version: int, deleted: bool, updated_at: string} */
    public function payload(): array {
        return ['id' => $this->uid, 'kind' => $this->kind, 'data' => $this->data, 'version' => $this->version, 'deleted' => $this->deleted, 'updated_at' => $this->updated_at->toISOString() ?? ''];
    }
}