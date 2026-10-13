<?php

declare(strict_types=1);
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('vault_records', function (Blueprint $table): void {
            $table->id(); $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('uid'); $table->string('kind', 16); $table->json('data');
            $table->unsignedInteger('version')->default(1); $table->boolean('deleted')->default(false); $table->timestamps();
            $table->unique(['owner_id','uid']); $table->index(['owner_id','kind','deleted']);
        });
        Schema::create('sync_receipts', function (Blueprint $table): void {
            $table->id(); $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('operation_id'); $table->json('result'); $table->timestamps(); $table->unique(['owner_id','operation_id']);
        });
        Schema::create('note_links', function (Blueprint $table): void {
            $table->id(); $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('source_uid'); $table->string('target_title',200); $table->index(['owner_id','source_uid']);
        });
    }
    public function down(): void { Schema::dropIfExists('note_links'); Schema::dropIfExists('sync_receipts'); Schema::dropIfExists('vault_records'); }
};