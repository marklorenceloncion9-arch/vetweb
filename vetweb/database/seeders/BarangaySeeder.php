<?php

namespace Database\Seeders;

use App\Models\Barangay;
use Illuminate\Database\Seeder;

class BarangaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $barangays = [
            'Amoros',
            'Bolisong',
            'Cogon',
            'Himaya',
            'Hinigdaan',
            'Kalabaylabay',
            'Molugan',
            'Pedro S. Baculio (Bolo-Bolo)',
            'Poblacion (city center)',
            'Quibonbon',
            'Sambulawan',
            'San Francisco de Asis (Calongonan)',
            'Sinaloc',
            'Taytay',
            'Ulaliman',
        ];

        foreach ($barangays as $barangayName) {
            Barangay::firstOrCreate(
                ['name' => $barangayName],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
