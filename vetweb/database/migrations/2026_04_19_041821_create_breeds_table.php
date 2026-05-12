<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('breeds', function (Blueprint $table) {
        $table->id();
        $table->foreignId('species_id')
              ->constrained('species')
              ->cascadeOnDelete();

        $table->string('breed_name');
        $table->unique(['species_id', 'breed_name']); // prevent duplicates
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('breeds');
    }
};
