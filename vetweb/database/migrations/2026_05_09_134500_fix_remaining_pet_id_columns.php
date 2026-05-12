<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $renameMap = [
            'bookings' => ['pet_id' => 'animal_id'],
            'complaints' => ['pet_id' => 'animal_id'],
            'pet_registrations' => ['pet_id' => 'animal_id'],
        ];

        foreach ($renameMap as $tableName => $columns) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            foreach ($columns as $from => $to) {
                if (Schema::hasColumn($tableName, $from) && !Schema::hasColumn($tableName, $to)) {
                    Schema::table($tableName, function (Blueprint $table) use ($from, $to) {
                        $table->renameColumn($from, $to);
                    });
                }
            }
        }
    }

    public function down(): void
    {
        $renameMap = [
            'bookings' => ['animal_id' => 'pet_id'],
            'complaints' => ['animal_id' => 'pet_id'],
            'pet_registrations' => ['animal_id' => 'pet_id'],
        ];

        foreach ($renameMap as $tableName => $columns) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            foreach ($columns as $from => $to) {
                if (Schema::hasColumn($tableName, $from) && !Schema::hasColumn($tableName, $to)) {
                    Schema::table($tableName, function (Blueprint $table) use ($from, $to) {
                        $table->renameColumn($from, $to);
                    });
                }
            }
        }
    }
};
