<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AnimalController;
use App\Http\Controllers\Api\AppointmentController;
use App\Models\Barangay;
use App\Models\Service;
use App\Models\VetUnavailability;
use App\Models\User;
use App\Models\Animal;
use App\Models\Appointment;
use App\Models\AppointmentService;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\TokenAuthMiddleware;

// API routes for mobile app authentication
Route::prefix('mobile')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/claim-account', [AuthController::class, 'claimAccount']);
    
    // OTP routes
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/reset-password-otp', [AuthController::class, 'resetPasswordWithOtp']);
    Route::post('/claim-account-otp', [AuthController::class, 'claimAccountWithOtp']);
    
    Route::get('/barangays', function () {
        return response()->json([
            'success' => true,
            'barangays' => Barangay::orderBy('name')->get(['id', 'name'])
        ]);
    });

    // Get services for appointments (mobile)
    Route::get('/services', function () {
        return response()->json([
            'success' => true,
            'services' => Service::orderBy('type_name')->get(['id', 'type_name', 'description'])
        ]);
    });

    // Legacy endpoint for backward compatibility
    Route::get('/treatment-types', function () {
        return response()->json([
            'success' => true,
            'treatment_types' => Service::orderBy('type_name')->get(['id', 'type_name', 'description'])
        ]);
    });

    // Get vet unavailable dates for calendar
    Route::get('/vet-unavailable-dates', function (Request $request) {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        
        $startDate = sprintf('%04d-%02d-01', $year, $month);
        $endDate = date('Y-m-t', strtotime($startDate));
        
        return response()->json([
            'success' => true,
            'unavailable_dates' => VetUnavailability::getUnavailableForRange($startDate, $endDate)
        ]);
    });

    // Get available time slots for a specific date
    Route::get('/available-time-slots', function (Request $request) {
        $date = $request->input('date');
        
        if (!$date) {
            return response()->json([
                'success' => false,
                'error' => 'Date parameter is required'
            ], 400);
        }
        
        // Generate all 20-minute time slots: 8:00-12:00 and 1:00-5:00
        $timeSlots = [];
        
        // Morning slots: 8:00 AM - 12:00 PM (8:00, 8:20, 8:40, ..., 11:40)
        for ($hour = 8; $hour < 12; $hour++) {
            for ($min = 0; $min < 60; $min += 20) {
                $time = sprintf('%02d:%02d', $hour, $min);
                $timeSlots[] = [
                    'time' => $time,
                    'label' => date('h:i A', strtotime($time)),
                    'period' => 'morning'
                ];
            }
        }
        
        // Afternoon slots: 1:00 PM - 5:00 PM (13:00, 13:20, ..., 16:40)
        for ($hour = 13; $hour < 17; $hour++) {
            for ($min = 0; $min < 60; $min += 20) {
                $time = sprintf('%02d:%02d', $hour, $min);
                $timeSlots[] = [
                    'time' => $time,
                    'label' => date('h:i A', strtotime($time)),
                    'period' => 'afternoon'
                ];
            }
        }
        
        // Get booked appointments for this date
        $bookedSlots = \App\Models\Appointment::where('appointment_date', $date)
            ->whereIn('status', ['pending', 'approved'])
            ->pluck('appointment_time')
            ->map(function ($time) {
                return date('H:i', strtotime($time));
            })
            ->toArray();
        
        // Check if date is today - if so, block past times
        $today = now()->format('Y-m-d');
        $currentTime = now()->format('H:i');
        $isToday = ($date === $today);
        
        // Mark available slots
        $availableSlots = array_map(function ($slot) use ($bookedSlots, $isToday, $currentTime) {
            // Slot is unavailable if already booked
            $isBooked = in_array($slot['time'], $bookedSlots);
            // Slot is unavailable if today and time has passed
            $isPast = $isToday && $slot['time'] < $currentTime;
            
            $slot['available'] = !$isBooked && !$isPast;
            return $slot;
        }, $timeSlots);
        
        return response()->json([
            'success' => true,
            'date' => $date,
            'slots' => $availableSlots,
        ]);
    });

    // Get symptoms list
    Route::get('/symptoms', function () {
        return response()->json([
            'success' => true,
            'symptoms' => \App\Models\Symptom::all()->map(function ($symptom) {
                return [
                    'id' => $symptom->id,
                    'name' => $symptom->name,
                ];
            }),
        ]);
    });

    // Protected routes
    Route::middleware(TokenAuthMiddleware::class)->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [UserController::class, 'profile']);
        Route::put('/user', [UserController::class, 'update']);
        
        // Animal routes (modal style)
        Route::get('/animals', [AnimalController::class, 'index']);
        Route::get('/animals/{id}', [AnimalController::class, 'show']);
        Route::post('/animals', [AnimalController::class, 'store']);
        Route::put('/animals/{id}', [AnimalController::class, 'update']);
        Route::delete('/animals/{id}', [AnimalController::class, 'destroy']);
        Route::post('/animals/{id}/archive', [AnimalController::class, 'archive']);
        Route::post('/animals/{id}/unarchive', [AnimalController::class, 'unarchive']);
        Route::get('/species', [AnimalController::class, 'getSpecies']);
        Route::get('/species/{speciesId}/breeds', [AnimalController::class, 'getBreedsBySpecies']);
        
        // Appointment routes
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::put('/mobile/appointments/{id}', [AppointmentController::class, 'update']);
        Route::patch('/mobile/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
    });
});

// Animal routes for admin panel (session auth)
Route::middleware('auth')->group(function () {
    Route::get('/animals', [AnimalController::class, 'index']);
    Route::get('/animals/{id}', [AnimalController::class, 'show']);
    Route::post('/animals', [AnimalController::class, 'store']);
    Route::put('/animals/{id}', [AnimalController::class, 'update']);
    Route::delete('/animals/{id}', [AnimalController::class, 'destroy']);
});

// Admin API routes (outside mobile prefix)
Route::prefix('admin')->group(function () {
    Route::put('/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);
    
    // Get walk-in appointments grouped by service (all statuses)
    Route::get('/services/completed-appointments', function (Request $request) {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        $services = \App\Models\Service::with(['appointments' => function($query) use ($startDate, $endDate) {
            $query->where('appointment_type', 'walk_in')
                  ->with(['animal.species', 'animal.breed', 'user', 'complaint.symptoms'])
                  ->orderBy('appointment_date', 'desc')
                  ->orderBy('appointment_time', 'desc');
                  
            // Apply date range filters if provided
            if ($startDate) {
                $query->whereDate('appointment_date', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('appointment_date', '<=', $endDate);
            }
        }])->get();
        
        return response()->json([
            'success' => true,
            'services' => $services->map(function($service) {
                // Separate appointments by status
                $completedAppointments = $service->appointments->where('status', 'completed')->values();
                $ongoingAppointments = $service->appointments->where('status', 'ongoing')->values();
                
                $formatAppointment = function($appointment) {
                    return [
                        'id' => $appointment->id,
                        'animal' => [
                            'pet_name' => $appointment->animal?->pet_name,
                            'species' => $appointment->animal?->species?->species_name,
                            'breed' => $appointment->animal?->breed?->breed_name,
                        ],
                        'user' => [
                            'id' => $appointment->user?->id,
                            'firstname' => $appointment->user?->firstname,
                            'lastname' => $appointment->user?->lastname,
                            'email' => $appointment->user?->email
                        ],
                        'appointment_date' => $appointment->appointment_date,
                        'appointment_time' => $appointment->appointment_time,
                        'status' => $appointment->status,
                        'notes' => $appointment->notes,
                        'administered_by' => $appointment->administered_by,
                        'appointment_type' => $appointment->appointment_type,
                        'is_bitten' => $appointment->complaint?->is_bitten ?? false,
                        'bite_details' => $appointment->complaint?->bite_details,
                        'symptoms' => $appointment->complaint?->symptoms ?? []
                    ];
                };
                
                return [
                    'id' => $service->id,
                    'type_name' => $service->type_name,
                    'description' => $service->description,
                    'completed_appointments' => $completedAppointments->map($formatAppointment),
                    'ongoing_appointments' => $ongoingAppointments->map($formatAppointment)
                ];
            })
        ]);
    });
});

// Admin API routes for vet availability
Route::prefix('admin')->group(function () {
    // Get unavailable dates for admin calendar
    Route::get('/vet-unavailable-dates', function (Request $request) {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        
        $startDate = sprintf('%04d-%02d-01', $year, $month);
        $endDate = date('Y-m-t', strtotime($startDate));
        
        return response()->json([
            'success' => true,
            'unavailable_dates' => \App\Models\VetUnavailability::getUnavailableForRange($startDate, $endDate)
        ]);
    });
    
    // Add unavailable date
    Route::post('/vet-unavailable-dates', function (Request $request) {
        $validated = $request->validate([
            'unavailable_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'type' => 'required|in:full_day,morning,afternoon',
        ]);
        
        // Check if date is already marked as unavailable
        $existing = \App\Models\VetUnavailability::where('unavailable_date', $validated['unavailable_date'])->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'error' => 'Date is already marked as unavailable'
            ], 400);
        }
        
        $unavailability = \App\Models\VetUnavailability::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Date marked as unavailable',
            'data' => $unavailability
        ]);
    });
    
    // Delete unavailable date
    Route::delete('/vet-unavailable-dates/{date}', function ($date) {
        $deleted = \App\Models\VetUnavailability::where('unavailable_date', $date)->delete();
        
        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => 'Date is now available'
            ]);
        }
        
        return response()->json([
            'success' => false,
            'error' => 'Date not found'
        ], 404);
    });
    
    // Admin Appointment Review Routes
    // Get all appointments (regular bookings only)
    Route::get('/all-appointments', function () {
        $appointments = \App\Models\Appointment::with(['user', 'animal.species', 'animal.breed', 'treatmentTypes', 'complaint.symptoms'])
            ->where('appointment_type', 'appointment')
            ->orderBy('appointment_date', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'appointments' => $appointments->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'user' => [
                        'id' => $appointment->user->id,
                        'name' => $appointment->user->firstname . ' ' . $appointment->user->lastname,
                        'email' => $appointment->user->email,
                    ],
                    'pet' => [
                        'id' => $appointment->animal->id,
                        'name' => $appointment->animal->pet_name,
                        'species' => $appointment->animal->species?->species_name ?? $appointment->animal->species,
                        'breed' => $appointment->animal->breed?->breed_name ?? $appointment->animal->breed,
                    ],
                    'service' => $appointment->treatmentTypes->first()?->type_name ?? 'General Check-up',
                    'services' => $appointment->treatmentTypes->pluck('type_name')->toArray(),
                    'date' => $appointment->appointment_date->format('Y-m-d'),
                    'time' => $appointment->appointment_time,
                    'notes' => $appointment->notes,
                    'administered_by' => $appointment->administered_by,
                    'complaint' => $appointment->complaint ? [
                        'id' => $appointment->complaint->id,
                        'is_bitten' => $appointment->complaint->is_bitten,
                        'bite_details' => $appointment->complaint->bite_details,
                        'symptoms' => $appointment->complaint->symptoms->map(function ($symptom) {
                            return [
                                'name' => $symptom->name,
                                'days_count' => $symptom->pivot->days_count,
                                'notes' => $symptom->pivot->notes,
                            ];
                        }),
                    ] : null,
                    'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
                ];
            }),
        ]);
    });
    
    // Get all available services for filtering
    Route::get('/services-list', function () {
        $services = \App\Models\Service::orderBy('type_name')->get(['id', 'type_name']);
        
        return response()->json([
            'success' => true,
            'services' => $services->pluck('type_name')->toArray(),
        ]);
    });
    
    // Get pending appointments for review
    Route::get('/pending-appointments', function () {
        $appointments = \App\Models\Appointment::where('status', 'pending')
            ->with(['user', 'animal.species', 'animal.breed', 'treatmentTypes', 'complaint.symptoms'])
            ->orderBy('appointment_date', 'asc')
            ->get();
            
        return response()->json([
            'success' => true,
            'appointments' => $appointments->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'user' => [
                        'id' => $appointment->user->id,
                        'name' => $appointment->user->firstname . ' ' . $appointment->user->lastname,
                        'email' => $appointment->user->email,
                    ],
                    'pet' => [
                        'id' => $appointment->animal->id,
                        'name' => $appointment->animal->pet_name,
                        'species' => $appointment->animal->species?->species_name ?? $appointment->animal->species,
                        'breed' => $appointment->animal->breed?->breed_name ?? $appointment->animal->breed,
                    ],
                    'service' => $appointment->treatmentTypes->first()?->type_name ?? 'General Check-up',
                    'services' => $appointment->treatmentTypes->pluck('type_name')->toArray(),
                    'date' => $appointment->appointment_date->format('Y-m-d'),
                    'time' => $appointment->appointment_time,
                    'notes' => $appointment->notes,
                    'complaint' => $appointment->complaint ? [
                        'id' => $appointment->complaint->id,
                        'is_bitten' => $appointment->complaint->is_bitten,
                        'bite_details' => $appointment->complaint->bite_details,
                        'symptoms' => $appointment->complaint->symptoms->map(function ($symptom) {
                            return [
                                'name' => $symptom->name,
                                'days_count' => $symptom->pivot->days_count,
                                'notes' => $symptom->pivot->notes,
                            ];
                        }),
                    ] : null,
                    'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
                ];
            }),
        ]);
    });
    
    // Approve appointment - using AppointmentController@updateStatus instead
    
    // Cancel appointment (admin)
    Route::patch('/appointments/{id}/cancel', function (Request $request, $id) {
        try {
            $appointment = \App\Models\Appointment::find($id);
            
            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'error' => 'Appointment not found'
                ], 404);
            }
            
            if ($appointment->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'error' => 'Appointment is already cancelled'
                ], 400);
            }
            
            $appointment->update(['status' => 'cancelled']);
            
            // Update complaint status too
            if ($appointment->complaint) {
                $appointment->complaint->update([
                    'status' => 'cancelled',
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Appointment cancelled successfully',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Appointment cancellation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to cancel appointment',
                'message' => $e->getMessage(),
            ], 500);
        }
    });
});

// Revenue API routes
Route::prefix('revenue')->group(function () {
    Route::get('/', [App\Http\Controllers\RevenueController::class, 'index']);
    Route::post('/update-fee', [App\Http\Controllers\RevenueController::class, 'updateFee']);
    Route::get('/history/{paymentTypeId}', [App\Http\Controllers\RevenueController::class, 'getHistory']);
});


// Public API routes (no mobile prefix)
Route::get('/services', function () {
    return response()->json([
        'success' => true,
        'services' => Service::orderBy('type_name')->get(['id', 'type_name', 'description'])
    ]);
});

// Clients API routes - accessible to admin users (session auth)
Route::middleware(['web'])->group(function () {
    Route::get('/clients', function (Request $request) {
        // Check if user is authenticated
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized - Please login'
            ], 401);
        }
        
        try {
            \Log::info('Fetching clients for user: ' . auth()->user()->email);
            
            // Get all users who are not admin/staff
            $clients = User::where(function($query) {
                $query->whereNotIn('role', ['data_manager', 'budget_officer', 'admin', 'veterinarian'])
                      ->orWhereNull('role');
            })
            ->orderByRaw('COALESCE(firstname, name)')
            ->get();
            
            \Log::info('Found ' . $clients->count() . ' clients');
            
            return response()->json([
                'success' => true,
                'clients' => $clients
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching clients: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    });

    // Get animals for a specific client
    Route::get('/clients/{id}/animals', function (Request $request, $id) {
        if (!auth()->check()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 401);
        }
        
        $animals = Animal::where('user_id', $id)
            ->with(['species', 'breed'])
            ->orderBy('pet_name')
            ->get();
        
        return response()->json([
            'success' => true,
            'animals' => $animals
        ]);
    });
});

Route::prefix('budget')->group(function () {
    Route::get('/categories', [App\Http\Controllers\BudgetInventoryController::class, 'getCategories']);
    Route::get('/units', [App\Http\Controllers\BudgetInventoryController::class, 'getUnits']);
    Route::get('/inventory', [App\Http\Controllers\BudgetInventoryController::class, 'index']);
    Route::post('/inventory', [App\Http\Controllers\BudgetInventoryController::class, 'store']);
    Route::get('/inventory/{id}', [App\Http\Controllers\BudgetInventoryController::class, 'show']);
    Route::get('/reports/usage', [App\Http\Controllers\BudgetInventoryController::class, 'usageReport']);
    
    // Budget Officer Treatments API routes
    Route::get('/treatments/processing', [App\Http\Controllers\Api\AppointmentController::class, 'getProcessingAppointments']);
    Route::post('/treatments/{id}/complete', [App\Http\Controllers\Api\AppointmentController::class, 'completeTreatment']);
});

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => now()
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
