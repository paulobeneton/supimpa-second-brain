<?php

declare(strict_types=1);
namespace App\Providers;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
final class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}
    public function boot(): void {
        RateLimiter::for('vault-api',fn(Request $r): Limit => Limit::perMinute(120)->by('api:'.$r->ip()));
        RateLimiter::for('login',fn(Request $r): Limit => Limit::perMinute(10)->by('login:'.$r->ip()));
        RateLimiter::for('registration',fn(Request $r): Limit => Limit::perMinute(5)->by('register:'.$r->ip()));
    }
}