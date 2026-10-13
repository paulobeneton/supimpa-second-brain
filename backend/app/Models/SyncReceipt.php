<?php

declare(strict_types=1);
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
/** @property array<string, mixed> $result */
final class SyncReceipt extends Model
{
    protected $guarded = ['id'];
    /** @return array<string, string> */
    protected function casts(): array { return ['result' => 'array']; }
}