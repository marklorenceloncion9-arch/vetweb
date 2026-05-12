<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('animal_registrations') && !Schema::hasTable('pet_registrations')) {
            Schema::rename('animal_registrations', 'pet_registrations');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pet_registrations') && !Schema::hasTable('animal_registrations')) {
            Schema::rename('pet_registrations', 'animal_registrations');
        }
    }
};
