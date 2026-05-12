<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename pets table to animals
        if (Schema::hasTable('pets') && !Schema::hasTable('animals')) {
            Schema::rename('pets', 'animals');
        }
    }

    public function down(): void
    {
        // Rollback: rename animals back to pets
        if (Schema::hasTable('animals') && !Schema::hasTable('pets')) {
            Schema::rename('animals', 'pets');
        }
    }
};
