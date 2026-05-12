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
        // This migration originally targeted an older "services_info" catalog table
        // (name/description/price). The project later repurposed `services_info` to
        // store per-pet service/treatment records. Guard to avoid dropping the new schema.
        if (
            Schema::hasTable('services_info')
            && Schema::hasColumn('services_info', 'name')
            && Schema::hasColumn('services_info', 'price')
            && !Schema::hasColumn('services_info', 'animal_id')
        ) {
            Schema::drop('services_info');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('services_info')) {
            return;
        }

        Schema::create('services_info', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }
};
