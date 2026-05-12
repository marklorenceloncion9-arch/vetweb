<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vhc_records', function (Blueprint $table) {
            $table->dropColumn('quantity');
            $table->integer('male_count')->default(0);
            $table->integer('female_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('vhc_records', function (Blueprint $table) {
            $table->dropColumn(['male_count', 'female_count']);
            $table->integer('quantity');
        });
    }
};
