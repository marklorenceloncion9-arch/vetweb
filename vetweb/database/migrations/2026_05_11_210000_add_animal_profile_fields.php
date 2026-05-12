<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            // Reproductive Status
            $table->enum('reproductive_status', ['pregnant', 'nursing', 'not_pregnant'])->nullable()->after('weight');
            $table->string('weeks_months', 50)->nullable()->after('reproductive_status');
            
            // Diet
            $table->enum('diet', ['commercial_food', 'table_food', 'both', 'others'])->nullable()->after('weeks_months');
            $table->string('diet_other', 255)->nullable()->after('diet');
            
            // Deworming History
            $table->enum('dewormed', ['yes', 'no'])->nullable()->after('diet_other');
            $table->date('last_deworming_date')->nullable()->after('dewormed');
            $table->string('dewormer_name', 255)->nullable()->after('last_deworming_date');
            
            // Vaccination History
            $table->enum('rabies_vaccine', ['yes', 'no'])->nullable()->after('dewormer_name');
            $table->date('rabies_last_vaccination')->nullable()->after('rabies_vaccine');
            
            $table->enum('dhppl_vaccine', ['yes', 'no'])->nullable()->after('rabies_last_vaccination');
            $table->date('dhppl_last_vaccination')->nullable()->after('dhppl_vaccine');
            
            $table->string('other_vaccine_name', 255)->nullable()->after('dhppl_last_vaccination');
            $table->date('other_vaccine_last_vaccination')->nullable()->after('other_vaccine_name');
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn([
                'reproductive_status',
                'weeks_months',
                'diet',
                'diet_other',
                'dewormed',
                'last_deworming_date',
                'dewormer_name',
                'rabies_vaccine',
                'rabies_last_vaccination',
                'dhppl_vaccine',
                'dhppl_last_vaccination',
                'other_vaccine_name',
                'other_vaccine_last_vaccination',
            ]);
        });
    }
};
