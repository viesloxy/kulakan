<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Batasi akses route berdasarkan role pengguna (SAD §9).
 *
 * Pemakaian di route: ->middleware('role:owner') atau ->middleware('role:owner,staff').
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(403, 'Peran Anda tidak memiliki akses ke halaman ini.');
        }

        return $next($request);
    }
}
