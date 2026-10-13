<?php

declare(strict_types=1);
use App\Http\Controllers\AuthController;
use App\Http\Controllers\VaultController;
use App\Http\Controllers\TokenController;
use Illuminate\Support\Facades\Route;
Route::prefix('api')->middleware('throttle:vault-api')->group(function (): void {
    Route::post('/register',[AuthController::class,'register'])->middleware('throttle:registration');
    Route::post('/login',[AuthController::class,'login'])->middleware('throttle:login');
    Route::middleware('auth:web')->group(function (): void {
        Route::get('/me',[AuthController::class,'me']);
        Route::post('/logout',[AuthController::class,'logout']);
        Route::post('/sync',VaultController::class);
        Route::get('/tokens',[TokenController::class,'index']);
        Route::post('/tokens',[TokenController::class,'store'])->middleware('throttle:login');
        Route::delete('/tokens/{id}',[TokenController::class,'destroy']);
    });
});
Route::get('/',function (): \Symfony\Component\HttpFoundation\BinaryFileResponse {
    abort_unless(file_exists(public_path('index.html')),503,'Execute o build do frontend.');
    return response()->file(public_path('index.html'),['Cache-Control'=>'no-cache']);
});