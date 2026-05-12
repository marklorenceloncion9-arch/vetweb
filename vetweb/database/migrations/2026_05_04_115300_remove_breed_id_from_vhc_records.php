<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vhc_records', function (Blueprint $table) {
            $table->dropForeign(['breed_id']);
            $table->dropColumn('breed_id');
        });
    }

    public function down(): void
    {
        Schema::table('vhc_records', function (Blueprint $table) {
            $table->foreignId('breed_id')->constrained('breeds')->onDelete('cascade');
        });
    }
};
