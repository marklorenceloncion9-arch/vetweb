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
        Schema::create('animals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('pet_name', 255);
            $table->unsignedBigInteger('species_id');
            $table->unsignedBigInteger('breed_id');
            $table->enum('sex', ['male', 'female']);
            $table->string('color', 255)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->date('birthdate')->nullable();
            // registration_status enum without 'pending' as requested
            $table->enum('registration_status', ['registered', 'declined', 'unregistered'])->default('unregistered');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('species_id')->references('id')->on('species')->onDelete('cascade');
            $table->foreign('breed_id')->references('id')->on('breeds')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animals');
    }
};
