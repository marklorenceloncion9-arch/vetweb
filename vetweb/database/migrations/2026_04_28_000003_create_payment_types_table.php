<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_types', function (Blueprint $table) {
            $table->id();
            $table->enum('payment_type', ['pet_registration', 'vhc_animal']);
            $table->string('type_name');
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        // Insert default payment types
        DB::table('payment_types')->insert([
            [
                'payment_type' => 'pet_registration',
                'type_name' => 'Pet Registration',
                'amount' => 100.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'payment_type' => 'vhc_animal',
                'type_name' => 'VHC Animal',
                'amount' => 0.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_types');
    }
};
