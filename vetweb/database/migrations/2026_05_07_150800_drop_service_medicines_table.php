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
        // Guard: `service_medicines` is required by service inventory / history.
        // This migration was added during a schema iteration and should not drop
        // the current table in normal environments.
        if (
            Schema::hasTable('service_medicines')
            && Schema::hasColumn('service_medicines', 'unit')
            && !Schema::hasColumn('service_medicines', 'unit_id')
        ) {
            Schema::drop('service_medicines');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('service_medicines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->foreignId('medicine_id')->constrained('medicines')->onDelete('cascade');
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 50);
            $table->timestamps();
        });
    }
};
