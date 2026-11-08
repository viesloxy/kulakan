<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * Injeksi header keamanan standar OWASP dan pencegahan fingerprinting versi (SEC-07).
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Hapus X-Powered-By dari level PHP runtime
        if (function_exists('header_remove')) {
            header_remove('X-Powered-By');
        }

        $response = $next($request);

        // Hapus X-Powered-By dari response header Symfony/Laravel
        $response->headers->remove('X-Powered-By');

        // Header pertahanan browser modern (SEC-07 & PENTEST-05)
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Content-Security-Policy dasar untuk membatasi eksekusi sumber daya berbahaya
        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
            "font-src 'self' data: https://fonts.bunny.net",
            "img-src 'self' data: blob:",
            "connect-src 'self' ws: wss:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'self'",
        ];
        $response->headers->set('Content-Security-Policy', implode('; ', $csp));

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
