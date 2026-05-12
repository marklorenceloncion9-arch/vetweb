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
        Schema::create('vet_unavailabilities', function (Blueprint $table) {
            $table->id();
            $table->date('unavailable_date');
            $table->text('reason')->nullable();
            $table->enum('type', ['full_day', 'morning', 'afternoon'])->default('full_day');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->unique('unavailable_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vet_unavailabilities');
    }
};
