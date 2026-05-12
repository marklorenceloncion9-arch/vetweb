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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->boolean('is_liquid')->default(0);
            $table->timestamps();
        });

        // Insert default units
        $units = [
            ['name' => 'capsules', 'is_liquid' => 0],
            ['name' => 'tablets', 'is_liquid' => 0],
            ['name' => 'boxes', 'is_liquid' => 0],
            ['name' => 'vials', 'is_liquid' => 1],
        ];

        foreach ($units as $unit) {
            \DB::table('units')->insert([
                'name' => $unit['name'],
                'is_liquid' => $unit['is_liquid'],
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
