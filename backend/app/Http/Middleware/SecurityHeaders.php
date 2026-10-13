<?php

declare(strict_types=1);
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
final class SecurityHeaders
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response {
        $response = $next($request);
        $response->headers->set('X-Content-Type-Options','nosniff');
        $response->headers->set('X-Frame-Options','DENY');
        $response->headers->set('Referrer-Policy','same-origin');
        $response->headers->set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
        // Existing editor uses React style attributes; scripts remain restricted to same-origin bundles.
        $response->headers->set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'");
        if ($request->is('api/*','mcp/*','sanctum/*')) { $response->headers->set('Cache-Control','no-store, private'); }
        if (app()->isProduction()) { $response->headers->set('Strict-Transport-Security','max-age=31536000'); }
        return $response;
    }
}