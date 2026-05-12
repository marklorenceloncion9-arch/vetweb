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
        Schema::table('users', function (Blueprint $table) {
            // Add client-specific fields
            $table->string('lastname')->nullable();
            $table->string('firstname')->nullable();
            $table->string('middlename')->nullable();
            $table->integer('age')->nullable();
            $table->foreignId('barangay_id')->nullable()->constrained();
            $table->string('zone')->nullable();
            $table->string('facebook')->nullable();
            $table->string('phone_number')->nullable();
            
            // Update role enum to include client (owner is same as client)
            $table->enum('role', ['data_manager', 'budget_officer', 'client'])->default('data_manager')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop client-specific fields
            $table->dropColumn(['lastname', 'firstname', 'middlename', 'age', 'barangay_id', 'zone', 'facebook', 'phone_number']);
            
            // Revert role enum back to original
            $table->enum('role', ['data_manager', 'budget_officer'])->default('data_manager')->change();
        });
    }
};
