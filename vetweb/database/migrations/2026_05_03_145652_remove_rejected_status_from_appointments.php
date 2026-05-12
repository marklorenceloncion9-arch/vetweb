<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update any existing appointments with 'rejected' status to 'pending'
        // This gives them another chance to be approved
        DB::table('appointments')
            ->where('status', 'rejected')
            ->update(['status' => 'pending']);
            
        // Also update any related complaints
        DB::table('complaints')
            ->where('status', 'rejected')
            ->update(['status' => 'pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse since we're just changing data
        // and the rejected status will be removed from the UI anyway
    }
};
