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
        Schema::create('treatment_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Seed default treatment types
        $treatmentTypes = [
            ['type_name' => 'Deworming', 'description' => 'Deworming treatment for pets', 'created_at' => now(), 'updated_at' => now()],
            ['type_name' => 'Vaccination', 'description' => 'Vaccination services for pets', 'created_at' => now(), 'updated_at' => now()],
            ['type_name' => 'Treatment', 'description' => 'General medical treatment for pets', 'created_at' => now(), 'updated_at' => now()],
            ['type_name' => 'Vitamin Supplement', 'description' => 'Vitamin and supplement services', 'created_at' => now(), 'updated_at' => now()],
        ];

        \DB::table('treatment_types')->insert($treatmentTypes);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatment_types');
    }
};
