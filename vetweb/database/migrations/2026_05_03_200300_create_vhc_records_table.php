<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vhc_records', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('purpose');
            $table->string('origin');
            $table->string('destination');
            $table->foreignId('species_id')->constrained('species')->onDelete('cascade');
            $table->foreignId('breed_id')->constrained('breeds')->onDelete('cascade');
            $table->integer('quantity');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vhc_records');
    }
};
