<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            BarangaySeeder::class,
            AnimalTypeSeeder::class,
        ]);

        User::firstOrCreate(
            ['email' => 'datamanager@example.com'],
            [
                'name' => 'Data Manager',
                'password' => bcrypt('password'),
                'role' => 'data_manager',
            ]
        );
    }
}
