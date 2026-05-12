<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('appointments') && !Schema::hasTable('bookings')) {
            Schema::rename('appointments', 'bookings');
        }

        if (Schema::hasTable('appointment_services') && !Schema::hasTable('booking_services')) {
            Schema::rename('appointment_services', 'booking_services');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('booking_services') && !Schema::hasTable('appointment_services')) {
            Schema::rename('booking_services', 'appointment_services');
        }

        if (Schema::hasTable('bookings') && !Schema::hasTable('appointments')) {
            Schema::rename('bookings', 'appointments');
        }
    }
};
