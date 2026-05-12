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
        // Drop stock movements table first (has foreign key)
        Schema::dropIfExists('stock_movements');
        
        // Drop inventory items table
        Schema::dropIfExists('inventory_items');
        
        // Remove migration records from migrations table
        DB::table('migrations')->whereIn('migration', [
            '2026_05_03_152128_create_inventory_items_table',
            '2026_05_03_152216_create_stock_movements_table'
        ])->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate inventory items table
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->integer('quantity')->default(0);
            $table->string('unit');
            $table->date('expiration_date');
            $table->decimal('cost_per_unit', 10, 2)->nullable();
            $table->string('supplier')->nullable();
            $table->timestamps();
        });

        // Recreate stock movements table
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->onDelete('cascade');
            $table->enum('movement_type', ['in', 'out']);
            $table->integer('quantity');
            $table->string('reason')->nullable();
            $table->decimal('cost_per_unit', 10, 2)->nullable();
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
        
        // Re-insert migration records
        DB::table('migrations')->insert([
            ['migration' => '2026_05_03_152128_create_inventory_items_table', 'batch' => 1],
            ['migration' => '2026_05_03_152216_create_stock_movements_table', 'batch' => 1],
        ]);
    }
};
