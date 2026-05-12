<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add registration_status column with 'exempt' included
        Schema::table('animals', function (Blueprint $table) {
            $table->enum('registration_status', ['registered', 'declined', 'unregistered', 'exempt'])->default('unregistered')->after('birthdate');
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn('registration_status');
        });
    }
};
