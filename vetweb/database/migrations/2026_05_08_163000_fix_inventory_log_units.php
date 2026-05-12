<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add unit_name column to inventory_logs if it doesn't exist
        if (!Schema::hasColumn('inventory_logs', 'unit_name')) {
            Schema::table('inventory_logs', function (Blueprint $table) {
                $table->string('unit_name')->nullable()->after('type');
            });
        }
        
        // Update existing records with correct unit names using MySQL JOIN syntax
        DB::statement("
            UPDATE inventory_logs il
            LEFT JOIN inventory i ON il.inventory_id = i.id
            LEFT JOIN units u ON i.unit_id = u.id
            LEFT JOIN medicines m ON il.medicine_id = m.id
            SET il.unit_name = (
                CASE 
                    WHEN i.unit_id IS NOT NULL THEN 
                        CASE 
                            WHEN LOWER(u.name) LIKE '%box%' OR LOWER(u.name) LIKE '%boxes%' THEN 'items'
                            ELSE u.name
                        END
                    WHEN LOWER(m.name) LIKE '%tablet%' OR LOWER(m.name) LIKE '%tab%' THEN 'tablets'
                    WHEN LOWER(m.name) LIKE '%capsule%' OR LOWER(m.name) LIKE '%cap%' THEN 'capsules'
                    WHEN LOWER(m.name) LIKE '%vial%' OR LOWER(m.name) LIKE '%maxima%' THEN 'vials'
                    ELSE 'unit'
                END
            )
            WHERE il.type = 'OUT'
        ");
    }

    public function down(): void
    {
        if (Schema::hasColumn('inventory_logs', 'unit_name')) {
            Schema::table('inventory_logs', function (Blueprint $table) {
                $table->dropColumn('unit_name');
            });
        }
    }
};
