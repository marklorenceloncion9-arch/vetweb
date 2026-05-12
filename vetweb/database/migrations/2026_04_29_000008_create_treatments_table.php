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
        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('appointment_id');
            $table->unsignedBigInteger('animal_id');
            
            $table->unsignedBigInteger('treatment_type_id');
            $table->unsignedBigInteger('complaint_id')->nullable();
            
            $table->string('administered_by');
            
            $table->text('notes')->nullable();
            
            $table->date('treatment_date');
            
            $table->timestamps();
            
            $table->foreign('appointment_id')->references('id')->on('appointments');
            $table->foreign('animal_id')->references('id')->on('animals');
            $table->foreign('treatment_type_id')->references('id')->on('treatment_types');
            $table->foreign('complaint_id')->references('id')->on('complaints');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatments');
    }
};
