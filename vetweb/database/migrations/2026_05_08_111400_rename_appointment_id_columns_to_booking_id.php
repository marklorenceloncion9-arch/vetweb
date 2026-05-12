<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('booking_services') && Schema::hasColumn('booking_services', 'appointment_id')) {
            $this->dropForeignByColumnIfExists('booking_services', 'appointment_id');

            Schema::table('booking_services', function (Blueprint $table) {
                $table->renameColumn('appointment_id', 'booking_id');
            });

            Schema::table('booking_services', function (Blueprint $table) {
                $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            });
        }

        if (Schema::hasTable('complaints') && Schema::hasColumn('complaints', 'appointment_id')) {
            $this->dropForeignByColumnIfExists('complaints', 'appointment_id');

            Schema::table('complaints', function (Blueprint $table) {
                $table->renameColumn('appointment_id', 'booking_id');
            });

            Schema::table('complaints', function (Blueprint $table) {
                $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            });
        }

        if (Schema::hasTable('treatments') && Schema::hasColumn('treatments', 'appointment_id')) {
            $this->dropForeignByColumnIfExists('treatments', 'appointment_id');

            Schema::table('treatments', function (Blueprint $table) {
                $table->renameColumn('appointment_id', 'booking_id');
            });

            Schema::table('treatments', function (Blueprint $table) {
                $table->foreign('booking_id')->references('id')->on('bookings');
            });
        }

        if (Schema::hasTable('services_info') && Schema::hasColumn('services_info', 'appointment_id')) {
            $this->dropForeignByColumnIfExists('services_info', 'appointment_id');

            Schema::table('services_info', function (Blueprint $table) {
                $table->renameColumn('appointment_id', 'booking_id');
            });

            Schema::table('services_info', function (Blueprint $table) {
                $table->foreign('booking_id')->references('id')->on('bookings');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('booking_services') && Schema::hasColumn('booking_services', 'booking_id')) {
            $this->dropForeignByColumnIfExists('booking_services', 'booking_id');

            Schema::table('booking_services', function (Blueprint $table) {
                $table->renameColumn('booking_id', 'appointment_id');
            });

            Schema::table('booking_services', function (Blueprint $table) {
                $table->foreign('appointment_id')->references('id')->on('bookings')->onDelete('cascade');
            });
        }

        if (Schema::hasTable('complaints') && Schema::hasColumn('complaints', 'booking_id')) {
            $this->dropForeignByColumnIfExists('complaints', 'booking_id');

            Schema::table('complaints', function (Blueprint $table) {
                $table->renameColumn('booking_id', 'appointment_id');
            });

            Schema::table('complaints', function (Blueprint $table) {
                $table->foreign('appointment_id')->references('id')->on('bookings')->onDelete('cascade');
            });
        }

        if (Schema::hasTable('treatments') && Schema::hasColumn('treatments', 'booking_id')) {
            $this->dropForeignByColumnIfExists('treatments', 'booking_id');

            Schema::table('treatments', function (Blueprint $table) {
                $table->renameColumn('booking_id', 'appointment_id');
            });

            Schema::table('treatments', function (Blueprint $table) {
                $table->foreign('appointment_id')->references('id')->on('bookings');
            });
        }

        if (Schema::hasTable('services_info') && Schema::hasColumn('services_info', 'booking_id')) {
            $this->dropForeignByColumnIfExists('services_info', 'booking_id');

            Schema::table('services_info', function (Blueprint $table) {
                $table->renameColumn('booking_id', 'appointment_id');
            });

            Schema::table('services_info', function (Blueprint $table) {
                $table->foreign('appointment_id')->references('id')->on('bookings');
            });
        }
    }

    private function dropForeignByColumnIfExists(string $table, string $column): void
    {
        $database = DB::getDatabaseName();

        $constraintName = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', $table)
            ->where('COLUMN_NAME', $column)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->value('CONSTRAINT_NAME');

        if ($constraintName) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$constraintName}`");
        }
    }
};
