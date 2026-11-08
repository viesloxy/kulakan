<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->owner = User::where('role', 'owner')->firstOrFail();
});

it('menyuntikkan header keamanan HTTP dan Content-Security-Policy (PENTEST-05)', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    $csp = $response->headers->get('Content-Security-Policy');
    expect($csp)->not->toBeNull()
        ->and($csp)->toContain("default-src 'self'")
        ->and($csp)->toContain("object-src 'none'")
        ->and($csp)->toContain("frame-ancestors 'self'");

    expect($response->headers->has('X-Powered-By'))->toBeFalse();
});

it('hanya membagikan data publik pengguna pada props auth.user (PENTEST-06)', function () {
    $response = $this->actingAs($this->owner)->get('/dashboard');

    $response->assertOk();
    $page = $response->original->getData()['page'];
    $authUser = $page['props']['auth']['user'];

    expect($authUser)->toHaveKeys(['id', 'name', 'email', 'role'])
        ->and($authUser)->not->toHaveKey('password')
        ->and($authUser)->not->toHaveKey('two_factor_secret')
        ->and($authUser)->not->toHaveKey('two_factor_recovery_codes')
        ->and($authUser)->not->toHaveKey('remember_token');
});
