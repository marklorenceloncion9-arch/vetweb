<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Complaint;
use App\Models\Animal;
use App\Models\Symptom;
use App\Models\Service;
use App\Models\Inventory;
use App\Models\InventoryLog;
use App\Models\ServiceMedicine;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    /**
     * Get user's appointments
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $appointments = Appointment::where('user_id', $user->id)
            ->with(['animal', 'treatmentType', 'treatmentTypes', 'complaint.symptoms' => function($query) {
                $query->select('symptoms.id', 'symptoms.name', 'complaint_symptoms.complaint_id', 'complaint_symptoms.days_count', 'complaint_symptoms.notes');
            }])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get(['id', 'animal_id', 'treatment_type_id', 'appointment_date', 'appointment_time', 'status', 'notes', 'created_at']);

        return response()->json([
            'success' => true,
            'appointments' => $appointments->map(function ($appointment) {
                $complaint = $appointment->complaint;
                return [
                    'id' => $appointment->id,
                    'petName' => $appointment->animal?->pet_name ?? 'Unknown',
                    'service' => $appointment->treatmentType?->type_name ?? 'General Check-up',
                    'services' => $appointment->treatmentTypes?->pluck('type_name') ?? [],
                    'date' => $appointment->appointment_date->format('Y-m-d'),
                    'date_formatted' => $appointment->appointment_date->format('M d, Y'),
                    'time' => date('h:i A', strtotime($appointment->appointment_time)),
                    'status' => $appointment->status,
                    'notes' => $appointment->notes,
                    'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
                    'symptoms' => $complaint?->symptoms?->map(function ($symptom) {
                        return [
                            'name' => $symptom->name,
                            'days_count' => $symptom->pivot->days_count,
                            'notes' => $symptom->pivot->notes,
                        ];
                    }) ?? [],
                    'isBitten' => $complaint?->is_bitten ?? false,
                    'biteDetails' => $complaint?->bite_details,
                ];
            }),
        ]);
    }

    /**
     * Create a new appointment with complaint and symptoms
     */
    public function store(Request $request)
    {
        // Debug: Log incoming request data
        \Log::info('Appointment store request data: ' . json_encode($request->all()));
        \Log::info('Animal ID received: ' . $request->animal_id);
        \Log::info('Animal ID type: ' . gettype($request->animal_id));
        \Log::info('Animal ID value: ' . $request->animal_id);
        
        $validator = Validator::make($request->all(), [
            'animal_id' => 'required|exists:animals,id',
            'treatment_type_id' => 'required|exists:services,id',
            'treatment_type_ids' => 'nullable|array',
            'treatment_type_ids.*' => 'exists:services,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string',
            'symptoms' => 'nullable|array',
            'symptoms.*.name' => 'required_with:symptoms|string',
            'symptoms.*.days_count' => 'nullable|integer|min:1',
            'symptoms.*.notes' => 'nullable|string',
            'is_bitten' => 'nullable|boolean',
            'bite_details' => 'nullable|string',
        ]);

        // Check if time slot is already booked
        $existingAppointment = Appointment::where('appointment_date', $request->appointment_date)
            ->where('appointment_time', $request->appointment_time . ':00')
            ->whereIn('status', ['pending', 'approved', 'processing', 'ongoing'])
            ->first();
            
        if ($existingAppointment) {
            return response()->json([
                'success' => false,
                'error' => 'This time slot is already booked. Please select another time.'
            ], 422);
        }

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Verify animal belongs to user
        $pet = Animal::where('id', $request->animal_id)->where('user_id', $user->id)->first();
        if (!$pet) {
            return response()->json([
                'success' => false,
                'error' => 'Animal not found or does not belong to you'
            ], 404);
        }

        try {
            DB::beginTransaction();

            // Create appointment with 'pending' status (waiting for admin approval)
            $appointment = Appointment::create([
                'user_id' => $user->id,
                'animal_id' => $request->animal_id,
                'treatment_type_id' => $request->treatment_type_id,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
                'status' => 'pending', // Pending admin approval
                'notes' => $request->notes,
                'appointment_type' => 'appointment',
            ]);

            // Attach multiple treatment types if provided
            $treatmentTypeIds = $request->treatment_type_ids ?? [];
            \Log::info('Treatment type IDs received: treatment_type_id=' . $request->treatment_type_id . ', treatment_type_ids=' . json_encode($treatmentTypeIds));
            if (!empty($treatmentTypeIds)) {
                // Add the primary treatment type if not already included
                if (!in_array($request->treatment_type_id, $treatmentTypeIds)) {
                    $treatmentTypeIds[] = $request->treatment_type_id;
                }
                \Log::info('Attaching treatment types: final_ids=' . json_encode($treatmentTypeIds));
                $appointment->treatmentTypes()->attach($treatmentTypeIds);
            } else {
                // Attach the single treatment type for backward compatibility
                \Log::info('Attaching single treatment type: id=' . $request->treatment_type_id);
                $appointment->treatmentTypes()->attach($request->treatment_type_id);
            }

            // Create complaint linked to appointment
            \Log::info('Creating complaint with bite info: is_bitten=' . ($request->is_bitten ? 'true' : 'false') . ', bite_details=' . $request->bite_details);
            
            $complaint = Complaint::create([
                'user_id' => $user->id,
                'animal_id' => $request->animal_id,
                'booking_id' => $appointment->id,
                'is_bitten' => $request->is_bitten ?? false,
                'bite_details' => $request->is_bitten ? $request->bite_details : 'none',
            ]);
            
            \Log::info('Complaint created: complaint_id=' . $complaint->id . ', is_bitten=' . ($complaint->is_bitten ? 'true' : 'false') . ', bite_details=' . $complaint->bite_details);

            // Attach symptoms to complaint if provided
            if ($request->has('symptoms') && is_array($request->symptoms)) {
                \Log::info('Attaching symptoms: ' . json_encode($request->symptoms));
                foreach ($request->symptoms as $symptomData) {
                    // Find or create symptom by name
                    $symptomName = $symptomData['name'] ?? $symptomData['symptom_id'] ?? null;
                    if ($symptomName) {
                        $symptom = Symptom::firstOrCreate(
                            ['name' => $symptomName],
                            ['name' => $symptomName]
                        );
                        // Ensure we have a valid symptom ID before attaching
                        if ($symptom && $symptom->id) {
                            $complaint->symptoms()->attach($symptom->id, [
                                'days_count' => $symptomData['days_count'] ?? null,
                                'notes' => $symptomData['notes'] ?? null,
                            ]);
                        }
                    }
                }
                \Log::info('Symptoms attached. Count: ' . count($request->symptoms));
            } else {
                \Log::info('No symptoms to attach. has(): ' . ($request->has('symptoms') ? 'true' : 'false'));
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Appointment submitted for review',
                'appointment' => [
                    'id' => $appointment->id,
                    'petName' => $pet->pet_name,
                    'service' => $appointment->treatmentType->type_name ?? 'General Check-up',
                    'date' => $appointment->appointment_date->format('Y-m-d'),
                    'date_formatted' => $appointment->appointment_date->format('M d, Y'),
                    'time' => date('h:i A', strtotime($appointment->appointment_time)),
                    'status' => $appointment->status,
                    'notes' => $appointment->notes,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Failed to create appointment',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel an appointment
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        
        $appointment = Appointment::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

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

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled successfully',
        ]);
    }

    /**
     * Update an appointment
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $appointment = Appointment::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'error' => 'Appointment not found'
            ], 404);
        }

        // Update appointment status
        if ($request->has('status')) {
            $validStatuses = ['pending', 'approved', 'processing', 'ongoing', 'completed', 'cancelled'];
            
            if (in_array($request->status, $validStatuses)) {
                $appointment->update(['status' => $request->status]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid status'
                ], 400);
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Appointment updated successfully',
        ]);
    }

    /**
     * Update appointment status (Admin only)
     */
    public function updateStatus(Request $request, $id)
    {
        \Log::info('updateStatus called: id=' . $id . ', request_data=' . json_encode($request->all()));
        
        try {
            $appointment = Appointment::find($id);

            if (!$appointment) {
                \Log::error('Appointment not found: id=' . $id);
                return response()->json([
                    'success' => false,
                    'error' => 'Appointment not found'
                ], 404);
            }

            $validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'processing', 'ongoing'];
            
            $status = $request->input('status');
            \Log::info('Checking status: status=' . $status . ', valid_statuses=' . json_encode($validStatuses));
            
            if ($status && in_array($status, $validStatuses)) {
                $appointment->update(['status' => $status]);
                
                \Log::info('Status updated successfully: appointment_id=' . $appointment->id . ', new_status=' . $status);
                
                // Deduct inventory when appointment is marked as ongoing or completed
                if (in_array($status, ['ongoing', 'completed'])) {
                    $this->deductInventoryForAppointment($appointment);
                }
                
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment status updated successfully',
                    'appointment' => $appointment->load(['pet', 'user'])
                ]);
            } else {
                \Log::error('Invalid status', ['status' => $status, 'valid_statuses' => $validStatuses]);
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid status. Valid statuses are: ' . implode(', ', $validStatuses)
                ], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Update status error', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return plain text error for debugging
            return response('Server error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Deduct inventory for appointment services
     */
    private function deductInventoryForAppointment(Appointment $appointment): void
    {
        try {
            \Log::info('=== DEDUCT INVENTORY START === appointment_id=' . $appointment->id);
            
            // Load appointment with services
            $appointment->load(['treatmentTypes', 'treatmentTypes.serviceMedicines', 'treatmentTypes.serviceMedicines.medicine', 'treatmentTypes.serviceMedicines.unit']);
            
            \Log::info('Loaded appointment with treatment types: appointment_id=' . $appointment->id . ', treatment_types_count=' . $appointment->treatmentTypes->count() . ', treatment_types_ids=' . json_encode($appointment->treatmentTypes->pluck('id')->toArray()));
            
            if ($appointment->treatmentTypes->count() === 0) {
                \Log::warning('No treatment types found for appointment: appointment_id=' . $appointment->id);
                return;
            }
            
            foreach ($appointment->treatmentTypes as $service) {
                \Log::info('Processing service: service_id=' . $service->id . ', service_name=' . $service->type_name . ', service_medicines_count=' . $service->serviceMedicines->count());
                
                if ($service->serviceMedicines->count() === 0) {
                    \Log::warning('No medicines linked to service: service_id=' . $service->id);
                    continue;
                }
                
                foreach ($service->serviceMedicines as $serviceMedicine) {
                    $medicine = $serviceMedicine->medicine;
                    $quantity = $serviceMedicine->quantity;
                    $unit = $serviceMedicine->unit;
                    
                    if (!$medicine) {
                        \Log::warning('Medicine not found for service medicine: service_medicine_id=' . $serviceMedicine->id);
                        continue;
                    }
                    
                    // Get inventory record for this medicine
                    $inventory = Inventory::where('medicine_id', $medicine->id)->first();
                    
                    if (!$inventory) {
                        \Log::warning('No inventory found for medicine: medicine_id=' . $medicine->id . ', medicine_name=' . $medicine->name);
                        continue;
                    }
                    
                    // Check if enough quantity is available
                    if ($inventory->quantity < $quantity) {
                        \Log::warning('Insufficient inventory for medicine: medicine_id=' . $medicine->id . ', medicine_name=' . $medicine->name . ', available=' . $inventory->quantity . ', needed=' . $quantity);
                        continue; // Skip deduction if not enough quantity
                    }
                    
                    // Deduct from inventory
                    $oldQuantity = $inventory->quantity;
                    $inventory->quantity -= $quantity;
                    $inventory->save();
                    
                    // Log the inventory change
                    InventoryLog::create([
                        'medicine_id' => $medicine->id,
                    'inventory_id' => $inventory->id,
                        'change_qty' => -$quantity,
                    'type' => 'OUT',
                    ]);
                    
                    \Log::info('Inventory deducted successfully: medicine_id=' . $medicine->id . ', medicine_name=' . $medicine->name . ', quantity_deducted=' . $quantity . ', old_quantity=' . $oldQuantity . ', new_quantity=' . $inventory->quantity . ', unit=' . $unit->unit_name ?? 'N/A');
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error deducting inventory for appointment: appointment_id=' . $appointment->id . ', error=' . $e->getMessage());
            // Don't throw - we don't want inventory issues to break appointment status updates
        }
    }

    /**
     * Get processing appointments for budget officer treatments
     */
    public function getProcessingAppointments()
    {
        $appointments = Appointment::where('status', 'ongoing')
            ->with(['animal.species', 'animal.breed', 'user', 'treatmentType', 'treatmentTypes', 'complaint.symptoms'])
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get();

        \Log::info('Ongoing appointments data: count=' . $appointments->count() . ', data=' . json_encode($appointments->toArray()));

        return response()->json([
            'success' => true,
            'appointments' => $appointments
        ]);
    }

    /**
     * Complete treatment and deduct selected inventory items.
     */
    public function completeTreatment(Request $request, $id)
    {
        $validated = $request->validate([
            'pet_weight' => 'nullable|numeric|min:0',
            'administered_by' => 'nullable|string|max:255',
            'selected_items' => 'nullable|array',
            'selected_items.*.inventory_id' => 'required|exists:inventory,id',
            'selected_items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        try {
            DB::beginTransaction();

            $appointment = Appointment::with('pet')->find($id);
            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'error' => 'Appointment not found',
                ], 404);
            }

            // Update pet weight when provided
            if (isset($validated['pet_weight']) && $appointment->pet) {
                $appointment->pet->update(['weight' => $validated['pet_weight']]);
            }

            $selectedItems = $validated['selected_items'] ?? [];

            foreach ($selectedItems as $selectedItem) {
                $inventory = Inventory::with('medicine')->lockForUpdate()->find($selectedItem['inventory_id']);

                if (!$inventory) {
                    throw new \Exception('Inventory item not found.');
                }

                $requestedQty = (float) $selectedItem['quantity'];
                $logDeductQty = $requestedQty;
                $bookingUnit = $inventory->unit?->name ?? 'unit';

                // Handle BOX type - calculate deduction using items_per_box, not a hardcoded 10.
                if ($inventory->isBox() && $inventory->items_per_box > 0) {
                    $itemsUsed = (float) $requestedQty;
                    $itemsPerBox = (float) $inventory->items_per_box;

                    // Total items available = boxes × items per box
                    $totalItemsAvailable = (float) $inventory->quantity * $itemsPerBox;

                    if ($itemsUsed > $totalItemsAvailable) {
                        throw new \Exception("Insufficient items in boxes for {$inventory->medicine?->name}. Available: {$totalItemsAvailable} items");
                    }

                    // Calculate remaining items after deduction
                    $remainingItems = $totalItemsAvailable - $itemsUsed;

                    // Convert back to boxes using the same per-box item count.
                    $inventory->quantity = $remainingItems > 0 ? $remainingItems / $itemsPerBox : 0;
                    $inventory->save();

                    $logDeductQty = $itemsUsed;
                    $bookingUnit = 'items';
                }
                // Handle VIAL type - calculate dosage
                elseif ($inventory->isVial()) {
                    if (!isset($validated['pet_weight']) || (float) $validated['pet_weight'] <= 0) {
                        throw new \Exception("Pet weight is required for vial item {$inventory->medicine?->name}.");
                    }
                    if ((float) $inventory->volume_ml <= 0) {
                        throw new \Exception("Volume (ml) is required for vial item {$inventory->medicine?->name}.");
                    }

                    // 1kg = 0.10ml. Convert ml dosage to vial quantity fraction.
                    $dosageMl = round(((float) $validated['pet_weight']) * 0.10, 2);
                    $deductQty = round($dosageMl / (float) $inventory->volume_ml, 3);
                    $logDeductQty = $dosageMl;
                    
                    if ((float) $inventory->quantity < $deductQty) {
                        throw new \Exception("Insufficient stock for {$inventory->medicine?->name}.");
                    }
                    
                    $inventory->quantity = (float) $inventory->quantity - $deductQty;
                    $inventory->save();
                }
                // Handle regular items (tablets, capsules)
                else {
                    if ((float) $inventory->quantity < $requestedQty) {
                        throw new \Exception("Insufficient stock for {$inventory->medicine?->name}.");
                    }
                    
                    $inventory->quantity = (float) $inventory->quantity - $requestedQty;
                    $inventory->save();
                }

                InventoryLog::create([
                    'medicine_id' => $inventory->medicine_id,
                    'inventory_id' => $inventory->id,
                    'change_qty' => -$logDeductQty,
                    'type' => 'OUT',
                ]);

                // Record actual medicine used for this booking
                \App\Models\BookingMedicine::create([
                    'booking_id' => $appointment->id,
                    'inventory_id' => $inventory->id,
                    'medicine_id' => $inventory->medicine_id,
                    'quantity_used' => $logDeductQty,
                    'unit_name' => $bookingUnit,
                    'dosage_ml' => $inventory->isVial() ? $logDeductQty : null,
                ]);
            }

            $appointment->updateQuietly([
                'status' => 'completed',
                'administered_by' => $validated['administered_by'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Treatment completed and inventory deducted successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
