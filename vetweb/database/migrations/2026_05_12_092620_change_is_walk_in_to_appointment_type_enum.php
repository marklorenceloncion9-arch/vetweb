<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change boolean to enum
        DB::statement("ALTER TABLE bookings MODIFY COLUMN is_walk_in ENUM('regular', 'walk_in', 'emergency') DEFAULT 'regular'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Change back to boolean
        DB::statement("ALTER TABLE bookings MODIFY COLUMN is_walk_in BOOLEAN DEFAULT FALSE");
    }
};
