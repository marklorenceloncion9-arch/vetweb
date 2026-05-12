<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make animal_id column nullable in bookings table.
     * If the table still contains pet_id, convert it first.
     */
    public function up(): void
    {
        if (Schema::hasTable('bookings')) {
            if (Schema::hasColumn('bookings', 'pet_id') && !Schema::hasColumn('bookings', 'animal_id')) {
                Schema::table('bookings', function (Blueprint $table) {
                    $table->renameColumn('pet_id', 'animal_id');
                });
            }

            if (Schema::hasColumn('bookings', 'animal_id')) {
                Schema::table('bookings', function (Blueprint $table) {
                    $table->unsignedBigInteger('animal_id')->nullable()->change();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'animal_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->unsignedBigInteger('animal_id')->nullable(false)->change();
            });
        }
    }
};
