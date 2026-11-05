<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Bu Rina (Pemilik)',
                'email' => 'owner@kulakan.com',
                'role' => 'owner',
            ],
            [
                'name' => 'Sari (Kasir)',
                'email' => 'staff@kulakan.com',
                'role' => 'staff',
            ],
        ];

        foreach ($users as $user) {
            User::factory()->create($user);
        }
    }
}