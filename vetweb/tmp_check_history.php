<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$animalId = (int)($argv[1] ?? 1);

$totalServicesInfo = App\Models\ServicesInfo::count();
$servicesInfoCount = App\Models\ServicesInfo::where('animal_id', $animalId)->count();
$sampleAnimalIds = App\Models\ServicesInfo::query()->select('animal_id')->distinct()->limit(10)->pluck('animal_id')->all();

$treatmentsExists = Illuminate\Support\Facades\Schema::hasTable('treatments');
$treatmentsCount = $treatmentsExists
    ? Illuminate\Support\Facades\DB::table('treatments')->where('animal_id', $animalId)->count()
    : null;

echo "animal_id={$animalId}\n";
echo "services_info total={$totalServicesInfo}\n";
echo "services_info count={$servicesInfoCount}\n";
echo 'services_info distinct animal_ids (sample)=' . json_encode($sampleAnimalIds) . "\n";
echo 'treatments table exists=' . ($treatmentsExists ? 'yes' : 'no') . "\n";
if ($treatmentsExists) {
    echo "treatments count={$treatmentsCount}\n";
}

