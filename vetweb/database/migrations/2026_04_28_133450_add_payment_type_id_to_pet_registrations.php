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
        // Add payment_type_id to pet_registrations
        Schema::table('pet_registrations', function (Blueprint $table) {
            $table->unsignedBigInteger('payment_type_id')->after('client_id')->nullable();
            $table->foreign('payment_type_id')->references('id')->on('payment_types')->nullOnDelete();
        });

        // Remove registration_status from animals table
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn('registration_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove payment_type_id from pet_registrations
        Schema::table('pet_registrations', function (Blueprint $table) {
            $table->dropForeign(['payment_type_id']);
            $table->dropColumn('payment_type_id');
        });

        // Add registration_status back to animals table
        Schema::table('animals', function (Blueprint $table) {
            $table->enum('registration_status', ['registered', 'declined', 'unregistered'])->default('unregistered');
        });
    }
};
