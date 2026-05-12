<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceMedicine;
use App\Models\Service;
use App\Models\Medicine;
use App\Models\Unit;

class ServiceMedicineSeeder extends Seeder
{
    public function run(): void
    {
        // Get inventory items (actual medicines the budget officer added)
        $inventory = \App\Models\Inventory::with(['medicine', 'unit'])->get();
        $units = Unit::all();

        if ($inventory->isEmpty()) {
            echo "No inventory items found. Please add medicines to inventory first.\n";
            return;
        }

        if ($units->isEmpty()) {
            echo "No units found.\n";
            return;
        }

        // Show available medicines from inventory
        echo "Available medicines in inventory:\n";
        foreach ($inventory as $inv) {
            echo "  - {$inv->medicine->name} ({$inv->unit->name})\n";
        }
        echo "\n";

        // Build service configs from ACTUAL inventory only
        $serviceConfigs = [];
        
        // Treatment always uses first 2 items from inventory
        if ($inventory->count() >= 1) {
            $first = $inventory[0];
            $serviceConfigs['Treatment'][] = [
                'medicine' => $first->medicine,
                'quantity' => 1,
                'unit' => $first->unit,
            ];
        }
        if ($inventory->count() >= 2) {
            $second = $inventory[1];
            $serviceConfigs['Treatment'][] = [
                'medicine' => $second->medicine,
                'quantity' => 2,
                'unit' => $second->unit,
            ];
        }
        
        // Other services use remaining inventory items
        if ($inventory->count() >= 3) {
            $third = $inventory[2];
            $serviceConfigs['Deworming'] = [
                [
                    'medicine' => $third->medicine,
                    'quantity' => 1,
                    'unit' => $third->unit,
                ],
            ];
        }
        if ($inventory->count() >= 4) {
            $fourth = $inventory[3];
            $serviceConfigs['Vaccination'] = [
                [
                    'medicine' => $fourth->medicine,
                    'quantity' => 1,
                    'unit' => $fourth->unit,
                ],
            ];
        }
        if ($inventory->count() >= 5) {
            $fifth = $inventory[4];
            $serviceConfigs['Spay'] = [
                [
                    'medicine' => $fifth->medicine,
                    'quantity' => 1,
                    'unit' => $fifth->unit,
                ],
            ];
        }
        if ($inventory->count() >= 6) {
            $sixth = $inventory[5];
            $serviceConfigs['Castration'] = [
                [
                    'medicine' => $sixth->medicine,
                    'quantity' => 1,
                    'unit' => $sixth->unit,
                ],
            ];
        }

        $createdCount = 0;

        foreach ($serviceConfigs as $serviceName => $configs) {
            $service = Service::where('type_name', $serviceName)->first();

            if (!$service) {
                echo "Service not found: {$serviceName}\n";
                continue;
            }

            // Clear existing medicines for this service to avoid duplicates
            ServiceMedicine::where('service_id', $service->id)->delete();

            foreach ($configs as $config) {
                $medicine = $config['medicine'];
                $unit = $config['unit'];

                if ($medicine && $unit) {
                    ServiceMedicine::create([
                        'service_id' => $service->id,
                        'medicine_id' => $medicine->id,
                        'quantity' => $config['quantity'],
                        'unit_id' => $unit->id,
                    ]);
                    $createdCount++;
                    echo "Created: {$serviceName} uses {$medicine->name} (qty: {$config['quantity']} {$unit->name})\n";
                }
            }
        }

        echo "\nTotal service-medicine links created: {$createdCount}\n";
    }
}
