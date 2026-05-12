<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Delete existing data_manager and owner users
        DB::table('users')
            ->whereIn('role', ['data_manager', 'owner'])
            ->delete();

        // Create new data_manager user with loncionm@gmail.com
        DB::table('users')->insert([
            'name' => 'Admin Manager',
            'firstname' => 'Admin',
            'lastname' => 'Manager',
            'email' => 'loncionm@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'data_manager',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert is not needed for this
    }
};
