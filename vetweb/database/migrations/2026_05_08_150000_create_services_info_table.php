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
        if (Schema::hasTable('services_info')) {
            return;
        }

        Schema::create('services_info', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id');
            $table->unsignedBigInteger('animal_id');
            $table->unsignedBigInteger('treatment_type_id');
            $table->unsignedBigInteger('complaint_id')->nullable();
            $table->string('administered_by');
            $table->text('notes')->nullable();
            $table->date('treatment_date');
            $table->timestamps();

            $table->foreign('booking_id')->references('id')->on('bookings');
            $table->foreign('animal_id')->references('id')->on('animals');
            $table->foreign('treatment_type_id')->references('id')->on('services');
            $table->foreign('complaint_id')->references('id')->on('complaints');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services_info');
    }
};

