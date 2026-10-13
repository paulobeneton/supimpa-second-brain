<?php

declare(strict_types=1);
namespace Tests\Feature;
use App\Models\User;
use App\Models\VaultRecord;
use App\Mcp\Tools\VaultTool;
use App\Services\VaultService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Mcp\Request as McpRequest;
use Tests\TestCase;
final class VaultTest extends TestCase
{
    use RefreshDatabase;
    /** @return array<string,mixed> */
    private function note(?string $id = null, int $version = 0, string $title = 'Nota'): array {
        return ['operation_id'=>(string)Str::uuid(),'id'=>$id ?? (string)Str::uuid(),'kind'=>'note','base_version'=>$version,'deleted'=>false,'data'=>['title'=>$title,'md'=>'Olá [[Outra nota]]','folder'=>'Inbox','tags'=>['teste']]];
    }
    public function test_guest_cannot_access_vault_or_issue_tokens(): void {
        $this->postJson('/api/sync',['mutations'=>[]])->assertUnauthorized();
        $this->getJson('/api/tokens')->assertUnauthorized();
    }
    public function test_register_login_and_logout(): void {
        config(['vault.registration'=>true]);
        $this->postJson('/api/register',['name'=>'Paulo','email'=>'paulo@example.test','password'=>'MinhaSenha12345','password_confirmation'=>'MinhaSenha12345'])->assertCreated()->assertJsonMissingPath('password');
        $this->getJson('/api/me')->assertOk()->assertJsonPath('email','paulo@example.test');
        $this->postJson('/api/logout')->assertOk();
        $this->postJson('/api/login',['email'=>'paulo@example.test','password'=>'errada'])->assertUnprocessable();
        $this->postJson('/api/login',['email'=>'paulo@example.test','password'=>'MinhaSenha12345'])->assertOk();
        $this->assertNotSame('MinhaSenha12345',User::firstOrFail()->password);
    }
    public function test_registration_can_be_disabled(): void {
        config(['vault.registration'=>false]);
        $this->postJson('/api/register',['name'=>'Teste','email'=>'a@example.test','password'=>'MinhaSenha12345','password_confirmation'=>'MinhaSenha12345'])->assertForbidden();
    }
    public function test_changes_are_persisted_and_retry_is_idempotent(): void {
        $user = User::factory()->create(); $this->actingAs($user); $m = $this->note();
        $this->postJson('/api/sync',['mutations'=>[$m]])->assertOk()->assertJsonPath('results.0.status','accepted')->assertJsonPath('records.0.version',1);
        $this->postJson('/api/sync',['mutations'=>[$m]])->assertOk()->assertJsonPath('records.0.version',1);
        $this->assertDatabaseCount('vault_records',1); $this->assertDatabaseCount('sync_receipts',1);
        $this->assertDatabaseHas('note_links',['owner_id'=>$user->id,'target_title'=>'Outra nota']);
    }
    public function test_stale_revision_preserves_both_versions(): void {
        $this->actingAs(User::factory()->create()); $m = $this->note();
        $this->postJson('/api/sync',['mutations'=>[$m]])->assertOk();
        $update = $this->note($m['id'],1,'Servidor'); $this->postJson('/api/sync',['mutations'=>[$update]])->assertOk();
        $stale = $this->note($m['id'],1,'Local');
        $this->postJson('/api/sync',['mutations'=>[$stale]])->assertOk()->assertJsonPath('results.0.status','conflict')->assertJsonPath('results.0.record.data.title','Servidor')->assertJsonPath('records.0.version',2);
    }
    public function test_accounts_are_isolated_even_when_ids_match(): void {
        $first = User::factory()->create(); $second = User::factory()->create(); $m = $this->note();
        $this->actingAs($first)->postJson('/api/sync',['mutations'=>[$m]])->assertOk();
        $this->actingAs($second)->postJson('/api/sync',['mutations'=>[]])->assertJsonCount(0,'records');
        $this->postJson('/api/sync',['mutations'=>[$this->note($m['id'])]])->assertOk();
        $this->assertDatabaseCount('vault_records',2);
    }
    public function test_delete_removes_links_and_restore_increments_version(): void {
        $this->actingAs(User::factory()->create()); $m = $this->note(); $this->postJson('/api/sync',['mutations'=>[$m]])->assertOk();
        $deleted = $this->note($m['id'],1); $deleted['deleted'] = true;
        $this->postJson('/api/sync',['mutations'=>[$deleted]])->assertOk()->assertJsonPath('records.0.deleted',true);
        $this->assertDatabaseCount('note_links',0);
        $this->postJson('/api/sync',['mutations'=>[$this->note($m['id'],2)]])->assertOk()->assertJsonPath('records.0.deleted',false)->assertJsonPath('records.0.version',3);
    }
    public function test_invalid_payload_and_duplicate_ids_are_rejected(): void {
        $this->actingAs(User::factory()->create()); $m = $this->note(); $m['data']['folder'] = 'Unknown';
        $this->postJson('/api/sync',['mutations'=>[$m]])->assertUnprocessable();
        $m = $this->note(); $this->postJson('/api/sync',['mutations'=>[$m,$m]])->assertUnprocessable();
        $this->assertDatabaseCount('vault_records',0);
    }
    public function test_markdown_whitespace_and_empty_notes_are_preserved(): void {
        $this->actingAs(User::factory()->create()); $m = $this->note(); $m['data']['title'] = ''; $m['data']['md'] = "  code\n\n";
        $this->postJson('/api/sync',['mutations'=>[$m]])->assertOk()->assertJsonPath('records.0.data.md',"  code\n\n")->assertJsonPath('records.0.data.title','');
        $m = $this->note(); $m['data']['md'] = ''; $this->postJson('/api/sync',['mutations'=>[$m]])->assertOk();
    }
    public function test_projects_are_saved_before_tasks_in_a_batch(): void {
        $this->actingAs(User::factory()->create());
        $project = ['operation_id'=>(string)Str::uuid(),'id'=>(string)Str::uuid(),'kind'=>'project','base_version'=>0,'deleted'=>false,'data'=>['title'=>'Site','client'=>'Cliente','color'=>'#0055a1','due'=>'']];
        $task = ['operation_id'=>(string)Str::uuid(),'id'=>(string)Str::uuid(),'kind'=>'task','base_version'=>0,'deleted'=>false,'data'=>['title'=>'Publicar','project_id'=>$project['id'],'status'=>'todo','due'=>'','subtasks'=>[['title'=>'Revisar','done'=>false]]]];
        $this->postJson('/api/sync',['mutations'=>[$task,$project]])->assertOk()->assertJsonCount(2,'records');
        $task['operation_id'] = (string)Str::uuid(); $task['base_version'] = 1; $task['data']['project_id'] = (string)Str::uuid();
        $this->postJson('/api/sync',['mutations'=>[$task]])->assertUnprocessable();
    }
    public function test_tokens_are_scoped_hidden_and_revocable(): void {
        $user = User::factory()->create(); $this->actingAs($user);
        $this->postJson('/api/tokens',['name'=>'Codex','write'=>false])->assertCreated()->assertJsonStructure(['token']);
        $this->getJson('/api/tokens')->assertOk()->assertJsonPath('0.abilities',['vault:read'])->assertJsonMissingPath('0.token');
        $id = $user->tokens()->firstOrFail()->id;
        $this->actingAs(User::factory()->create())->deleteJson('/api/tokens/'.$id)->assertNotFound();
        $this->actingAs($user)->deleteJson('/api/tokens/'.$id)->assertOk();
        $this->assertDatabaseCount('personal_access_tokens',0);
    }
    public function test_mcp_rejects_guest_and_read_only_write(): void {
        $this->postJson('/mcp/vault',['jsonrpc'=>'2.0','id'=>1,'method'=>'tools/list'])->assertUnauthorized();
        $user = User::factory()->create(); $token = $user->createToken('read',['vault:read'])->accessToken;
        $this->actingAs($user->withAccessToken($token));
        $response = app(VaultTool::class)->handle(new McpRequest(['action'=>'create','title'=>'Via MCP']),app(VaultService::class));
        $this->assertTrue($response->isError()); $this->assertDatabaseCount('vault_records',0);
    }
    public function test_mcp_can_search_read_create_and_update_with_write_scope(): void {
        $user = User::factory()->create(); $token = $user->createToken('write',['vault:read','vault:write'])->accessToken;
        $this->actingAs($user->withAccessToken($token)); $tool = app(VaultTool::class); $service = app(VaultService::class);
        $created = $tool->handle(new McpRequest(['action'=>'create','title'=>'Teste MCP','md'=>'Conteúdo']),$service);
        $this->assertFalse($created->isError()); $record = VaultRecord::firstOrFail();
        $this->assertFalse($tool->handle(new McpRequest(['action'=>'search','query'=>'teste']),$service)->isError());
        $this->assertFalse($tool->handle(new McpRequest(['action'=>'read','id'=>$record->uid]),$service)->isError());
        $this->assertFalse($tool->handle(new McpRequest(['action'=>'update','id'=>$record->uid,'version'=>1,'md'=>'Editado']),$service)->isError());
        $this->assertSame('Editado',$record->fresh()->data['md']);
        $this->assertTrue($tool->handle(new McpRequest(['action'=>'update','id'=>(string)Str::uuid(),'version'=>1]),$service)->isError());
    }
    public function test_sensitive_responses_are_not_cacheable(): void {
        $this->actingAs(User::factory()->create())->getJson('/api/me')->assertHeader('X-Content-Type-Options','nosniff')->assertHeader('Cache-Control','no-store, private');
    }
    public function test_login_is_rate_limited(): void {
        for ($i=0;$i<10;$i++) { $this->postJson('/api/login',['email'=>'nobody@example.test','password'=>'incorrect'])->assertUnprocessable(); }
        $this->postJson('/api/login',['email'=>'nobody@example.test','password'=>'incorrect'])->assertTooManyRequests();
    }
}