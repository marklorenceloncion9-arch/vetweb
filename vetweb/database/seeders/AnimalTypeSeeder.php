<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnimalTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
{
    $types = ['Pet Animals', 'Livestock', 'Poultry'];
    
    foreach ($types as $type) {
        \App\Models\AnimalType::firstOrCreate(
            ['type_name' => $type],
            ['type_name' => $type]
        );
    }
}
}
