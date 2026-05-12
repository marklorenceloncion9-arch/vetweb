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
        // Insert spay and castration services
        \DB::table('services')->insert([
            [
                'type_name' => 'Spay',
                'description' => 'Spaying surgery for female animals',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'type_name' => 'Castration',
                'description' => 'Castration surgery for male animals',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove spay and castration services
        \DB::table('services')
            ->whereIn('type_name', ['Spay', 'Castration'])
            ->delete();
    }
};
