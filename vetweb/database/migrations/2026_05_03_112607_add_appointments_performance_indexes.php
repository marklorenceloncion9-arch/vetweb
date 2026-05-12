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
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['user_id', 'appointment_date', 'appointment_time'], 'appointments_user_date_time_index');
            $table->index(['user_id', 'status'], 'appointments_user_status_index');
            $table->index(['animal_id'], 'appointments_animal_id_index');
            $table->index(['treatment_type_id'], 'appointments_treatment_type_index');
        });
        
        Schema::table('complaints', function (Blueprint $table) {
            $table->index(['appointment_id'], 'complaints_appointment_id_index');
            $table->index(['user_id', 'animal_id'], 'complaints_user_animal_index');
        });
        
        Schema::table('complaint_symptoms', function (Blueprint $table) {
            $table->index(['complaint_id'], 'complaint_symptoms_complaint_id_index');
            $table->index(['symptom_id'], 'complaint_symptoms_symptom_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('appointments_user_date_time_index');
            $table->dropIndex('appointments_user_status_index');
            $table->dropIndex('appointments_animal_id_index');
            $table->dropIndex('appointments_treatment_type_index');
        });
        
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropIndex('complaints_appointment_id_index');
            $table->dropIndex('complaints_user_animal_index');
        });
        
        Schema::table('complaint_symptoms', function (Blueprint $table) {
            $table->dropIndex('complaint_symptoms_complaint_id_index');
            $table->dropIndex('complaint_symptoms_symptom_id_index');
        });
    }
};
