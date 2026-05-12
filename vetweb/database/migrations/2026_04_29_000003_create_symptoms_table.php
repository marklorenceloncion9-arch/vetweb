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
        Schema::create('symptoms', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Seed common symptoms
        $symptoms = [
            ['name' => 'Fever', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Vomiting', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Diarrhea', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Loss of Appetite', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Coughing', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sneezing', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Lethargy', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Itching', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Skin Rashes', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Difficulty Breathing', 'created_at' => now(), 'updated_at' => now()],
        ];

        \DB::table('symptoms')->insert($symptoms);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('symptoms');
    }
};
