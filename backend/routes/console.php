<?php

declare(strict_types=1);
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
Artisan::command('vault:user {email} {--reset-password}', function (): void {
    $email = strtolower((string)$this->argument('email'));
    $existing = User::query()->where('email',$email)->first();
    if ($existing && !$this->option('reset-password')) { $this->error('A conta já existe. Use --reset-password para redefinir a senha.'); return; }
    $name = $existing?->name ?? $this->ask('Nome');
    $password = $this->secret('Senha (mínimo de 12 caracteres, letras e números)');
    $confirm = $this->secret('Confirme a senha');
    $data = Validator::make(['name'=>$name,'email'=>$email,'password'=>$password,'password_confirmation'=>$confirm],['name'=>'required|string|max:100','email'=>'required|email|max:254','password'=>['required','confirmed',Password::min(12)->letters()->numbers()]])->validate();
    User::query()->updateOrCreate(['email'=>$email],['name'=>$data['name'],'password'=>$data['password']]);
    if ($existing) { $existing->tokens()->delete(); \Illuminate\Support\Facades\DB::table('sessions')->where('user_id',$existing->id)->delete(); }
    $this->info('Conta salva.');
})->purpose('Criar uma conta ou redefinir sua senha sem cadastro público');