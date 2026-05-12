<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pets') && !Schema::hasTable('animals')) {
            Schema::rename('pets', 'animals');
        }

        $this->renamePetIdColumn('bookings', true);
        $this->renamePetIdColumn('complaints');
        $this->renamePetIdColumn('services_info');
        $this->renamePetIdColumn('pet_registrations');
    }

    public function down(): void
    {
        $this->renameAnimalIdColumn('bookings', true);
        $this->renameAnimalIdColumn('complaints');
        $this->renameAnimalIdColumn('services_info');
        $this->renameAnimalIdColumn('pet_registrations');

        if (Schema::hasTable('animals') && !Schema::hasTable('pets')) {
            Schema::rename('animals', 'pets');
        }
    }

    private function renameAnimalIdColumn(string $table, bool $nullable = false): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        if (Schema::hasColumn($table, 'animal_id') && !Schema::hasColumn($table, 'pet_id')) {
            Schema::table($table, function (Blueprint $table) {
                $table->renameColumn('animal_id', 'pet_id');
            });
        }
    }

    private function renamePetIdColumn(string $table, bool $nullable = false): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        if (Schema::hasColumn($table, 'pet_id') && !Schema::hasColumn($table, 'animal_id')) {
            Schema::table($table, function (Blueprint $table) {
                $table->renameColumn('pet_id', 'animal_id');
            });
        }
    }
};
