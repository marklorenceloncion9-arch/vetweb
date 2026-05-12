<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vhc_records', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['species_id']);
            // Now drop the columns
            $table->dropColumn(['species_id', 'male_count', 'female_count']);
        });
    }

    public function down(): void
    {
        Schema::table('vhc_records', function (Blueprint $table) {
            $table->foreignId('species_id')->nullable()->constrained('species');
            $table->integer('male_count')->default(0);
            $table->integer('female_count')->default(0);
        });
    }
};
