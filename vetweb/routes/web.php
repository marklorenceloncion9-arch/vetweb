<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ClientController;

Route::get('/', function () {
    return Inertia::render('Auth/Login');
});

// Admin authentication routes
Route::prefix('admin')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('admin.login');
    Route::post('/login', [AuthController::class, 'login'])->name('admin.login.submit');
    Route::post('/register', [AuthController::class, 'register'])->name('admin.register');
    Route::post('/logout', [AuthController::class, 'logout'])->name('admin.logout');
    Route::get('/dashboard', [AuthController::class, 'dashboard'])->name('admin.dashboard');
    // Revenue routes
    Route::get('/revenue', function () {
        return Inertia::render('Admin/revenue');
    })->name('admin.revenue');
    Route::get('/revenue/pet-registration', function () {
        return Inertia::render('Admin/RevenuePetRegistration');
    })->name('admin.revenue.pet-registration');
    Route::get('/revenue/vhc', function () {
        return Inertia::render('Admin/RevenueVhc');
    })->name('admin.revenue.vhc');
    
    // Client management routes
    Route::get('/clients', [ClientController::class, 'index'])->name('admin.clients');
    Route::post('/clients', [ClientController::class, 'store'])->name('admin.clients.store');
    Route::get('/clients/{client}', [ClientController::class, 'show'])->name('admin.clients.show');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('admin.clients.update');
    Route::post('/clients/{client}/create-account', [ClientController::class, 'createAccount'])->name('admin.clients.create-account');
    Route::get('/barangays', [ClientController::class, 'getBarangays'])->name('admin.barangays');
    
    // Species and breeds management routes
    Route::post('/species', [ClientController::class, 'storeSpecies'])->name('admin.species.store');
    Route::post('/breeds', [ClientController::class, 'storeBreed'])->name('admin.breeds.store');
    Route::get('/animal-data', [ClientController::class, 'getAnimalData'])->name('admin.animal-data');
    
    // Animal management routes
    Route::post('/clients/{client}/animals', [ClientController::class, 'storePet'])->name('admin.clients.animals.store');
    Route::put('/clients/{client}/animals/{pet}', [ClientController::class, 'updatePet'])->name('admin.clients.animals.update');
    Route::post('/clients/{client}/animals/{pet}/status', [ClientController::class, 'updatePetStatus'])->name('admin.clients.animals.status');
    Route::get('/clients/{client}/animals/{pet}/history', [ClientController::class, 'petHistory'])->name('admin.clients.animals.history');
    
    // Appointments route
    Route::get('/appointments', function () {
        return Inertia::render('Admin/Appointments');
    })->name('admin.appointments');

    // Services route
    Route::get('/services', function () {
        return Inertia::render('Admin/Services');
    })->name('admin.services');
    
    // Walk-in appointment route
    Route::post('/walk-in-appointment', function (\Illuminate\Http\Request $request) {
        \Illuminate\Support\Facades\Log::info('Walk-in appointment request received', [
            'client_id' => $request->input('client_id'),
            'animal_id' => $request->input('animal_id'),
            'service_id' => $request->input('service_id'),
            'service_ids' => $request->input('service_ids'),
            'appointment_date' => $request->input('appointment_date'),
            'appointment_time' => $request->input('appointment_time'),
            'auth_check' => auth()->check()
        ]);
        
        try {
            $validated = $request->validate([
                'client_id' => 'required|exists:users,id',
                'animal_id' => 'required|exists:animals,id',
                'service_id' => 'required|exists:services,id',
                'service_ids' => 'nullable|array',
                'service_ids.*' => 'exists:services,id',
                'appointment_date' => 'required|date_format:Y-m-d',
                'appointment_time' => 'required|date_format:H:i',
                'administered_by' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'status' => 'required|in:ongoing,completed',
                'symptoms' => 'nullable|array'
            ], [
                'client_id.required' => 'Client is required.',
                'client_id.exists' => 'Selected client does not exist.',
                'animal_id.required' => 'Animal/Pet is required.',
                'animal_id.exists' => 'Selected animal does not exist.',
                'service_id.required' => 'Service is required.',
                'service_id.exists' => 'Selected service does not exist.',
                'appointment_date.required' => 'Appointment date is required.',
                'appointment_date.date_format' => 'Appointment date must be in YYYY-MM-DD format.',
                'appointment_time.required' => 'Appointment time is required.',
                'appointment_time.date_format' => 'Appointment time must be in HH:MM format.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation errors:', $e->errors());
            throw $e;
        }
        
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();
            
            $selectedServiceIds = $validated['service_ids'] ?? [];
            if (!empty($selectedServiceIds) && !in_array($validated['service_id'], $selectedServiceIds)) {
                $selectedServiceIds[] = $validated['service_id'];
            }
            if (empty($selectedServiceIds)) {
                $selectedServiceIds = [$validated['service_id']];
            }
            
            // Create appointment
            $appointment = \App\Models\Appointment::create([
                'user_id' => $validated['client_id'],
                'animal_id' => $validated['animal_id'],
                'treatment_type_id' => $selectedServiceIds[0],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $validated['appointment_time'],
                'status' => $validated['status'],
                'administered_by' => $validated['administered_by'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'appointment_type' => 'walk_in',
            ]);
            
            // Link selected services to appointment
            foreach (array_unique($selectedServiceIds) as $serviceId) {
                \App\Models\AppointmentService::create([
                    'booking_id' => $appointment->id,
                    'treatment_type_id' => $serviceId,
                ]);
            }
            
            // Save symptoms/complaints if provided and table exists
            if (!empty($validated['symptoms'])) {
                try {
                    $complaint = \App\Models\Complaint::create([
                        'booking_id' => $appointment->id,
                        'animal_id' => $validated['animal_id'],
                        'user_id' => $validated['client_id'],
                        'is_bitten' => $request->input('is_bitten', false),
                        'bite_details' => $request->input('is_bitten') ? $request->input('bite_details') : null,
                        'other_symptoms' => null,
                    ]);
                    
                    // Link symptoms to complaint
                    foreach ($validated['symptoms'] as $symptomData) {
                        if (!empty($symptomData['name'])) {
                            // Find or create symptom
                            $symptom = \App\Models\Symptom::firstOrCreate(
                                ['name' => $symptomData['name']],
                                ['name' => $symptomData['name']]
                            );
                            
                            // Link to complaint - wrap in try-catch in case table doesn't exist
                            try {
                                \Illuminate\Support\Facades\DB::table('complaint_symptom')->insert([
                                    'complaint_id' => $complaint->id,
                                    'symptom_id' => $symptom->id,
                                    'days_count' => $symptomData['days_count'] ?? null,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            } catch (\Exception $tableError) {
                                \Illuminate\Support\Facades\Log::warning('complaint_symptom table error (skipping):', ['error' => $tableError->getMessage()]);
                                // Continue without stopping - the appointment is created successfully
                            }
                        }
                    }
                } catch (\Exception $complaintError) {
                    \Illuminate\Support\Facades\Log::warning('Complaint/symptom save error (skipping):', ['error' => $complaintError->getMessage()]);
                    // Continue without stopping - the appointment is created successfully
                }
            }
            
            \Illuminate\Support\Facades\DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Walk-in appointment created successfully',
                'appointment' => $appointment
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Failed to create walk-in appointment: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to create walk-in appointment: ' . $e->getMessage()
            ], 422);
        }
    })->name('admin.walk-in-appointment');

    // VHC (Veterinary Health Card) routes
    Route::get('/vhc', [ClientController::class, 'vhcIndex'])->name('admin.vhc.index');
    Route::get('/vhc/{vhc}', [ClientController::class, 'vhcShow'])->name('admin.vhc.show');
    Route::post('/vhc', [ClientController::class, 'vhcStore'])->name('admin.vhc.store');
    Route::put('/vhc/{vhc}', [ClientController::class, 'vhcUpdate'])->name('admin.vhc.update');
    Route::post('/vhc/{vhc}/livestock', [ClientController::class, 'vhcAddLivestock'])->name('admin.vhc.livestock.add');

    // Settings routes
    Route::get('/settings', [AuthController::class, 'settings'])->name('admin.settings');
    Route::post('/settings/registration-fee', [AuthController::class, 'updateRegistrationFee'])->name('admin.settings.registration-fee');
    Route::post('/settings/payment-types/{id}', [AuthController::class, 'updatePaymentType'])->name('admin.settings.payment-types.update');
});

// Budget Officer routes (outside admin prefix)
Route::get('/budget/dashboard', [AuthController::class, 'budgetDashboard'])->name('budget.dashboard');
Route::get('/budget/inventory', function () {
    return Inertia::render('budget/InventoryList');
})->name('budget.inventory');
Route::get('/budget/inventory/add', function () {
    return Inertia::render('budget/AddInventory');
})->name('budget.inventory.add');
Route::get('/budget/inventory/{id}', function ($id) {
    return Inertia::render('budget/InventoryDetail', ['id' => $id]);
})->name('budget.inventory.show');
Route::get('/budget/treatments', function () {
    return Inertia::render('budget/Treatments');
})->name('budget.treatments');
Route::get('/budget/reports', function () {
    return Inertia::render('budget/budgetreports');
})->name('budget.reports');
