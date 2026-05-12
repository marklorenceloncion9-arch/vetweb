<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('appointment_treatment_types', 'appointment_services');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('appointment_services', 'appointment_treatment_types');
    }
};
