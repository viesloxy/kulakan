<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_is_disabled_for_security()
    {
        // SEC-02: Pendaftaran publik dinonaktifkan. Staf hanya dibuat oleh Owner via menu Pengguna.
        $this->assertFalse(Features::enabled(Features::registration()));

        $response = $this->get('/register');
        $response->assertNotFound();

        $postResponse = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        $postResponse->assertNotFound();
    }
}
