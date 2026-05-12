<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Barangay;
use App\Models\AnimalType;
use App\Models\Species;
use App\Models\Breed;
use App\Models\Animal;
use App\Models\AnimalRegistration;
use App\Models\PetRegistration;
use App\Models\PaymentType;
use App\Models\RevenueHistory;
use App\Models\Appointment;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\ServicesInfo;

class ClientController extends Controller
{
    /**
     * Display the clients page.
     */
    public function index(Request $request)
    {
        $query = User::where('role', 'client')
            ->with('barangay')
            ->withCount('animals');
            
        // Filter by barangay if selected
        if ($request->has('barangay_id') && $request->barangay_id) {
            $query->where('barangay_id', $request->barangay_id);
        }
        
        // Search by name if provided
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('firstname', 'like', "%{$searchTerm}%")
                  ->orWhere('lastname', 'like', "%{$searchTerm}%")
                  ->orWhere('middlename', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }
        
        $clients = $query->latest()->get();
        $barangays = \App\Models\Barangay::orderBy('name')->get() ?? [];

        return Inertia::render('Admin/Client', [
            'clients' => $clients,
            'barangays' => $barangays
        ]);
    }

    /**
     * Store a new client.
     */
    public function store(Request $request)
    {
        \Log::info('Client creation attempt', ['request_data' => $request->all()]);

        $validated = $request->validate([
            'lastname' => 'required|string|max:255',
            'firstname' => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'age' => 'required|integer|min:1|max:150',
            'barangay_id' => 'required|exists:barangays,id',
            'zone' => 'required|string|max:255',
            'facebook' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|regex:/^09\d{9}$/',
            'email' => 'nullable|string|email|max:255|unique:users',
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|in:client',
            'skip_account_creation' => 'nullable|boolean',
        ]);

        \Log::info('Validation passed', ['validated' => $validated]);

        // If skip_account_creation is true, just save client data without login account
        if (!empty($validated['skip_account_creation']) && $validated['skip_account_creation']) {
            // Use placeholder email for record keeping - no login account created
            $timestamp = time();
            $random = substr(str_shuffle('abcdefghijklmnopqrstuvwxyz'), 0, 5);
            $validated['email'] = 'client.' . strtolower($validated['lastname']) . '.' . $random . $timestamp . '@vetcare.local';
            $validated['password'] = Hash::make('TempPass123!');
            $validated['password_setup_required'] = false;
        } else {
            // Full account creation with email and password
            $validated['password'] = Hash::make($validated['password']);
            $validated['password_setup_required'] = false;
        }

        $validated['name'] = $validated['firstname'] . ' ' . $validated['lastname'];
        $validated['email_verified_at'] = now();

        \Log::info('About to create user', ['data' => $validated]);

        try {
            $user = User::create($validated);
            \Log::info('User created successfully', ['user_id' => $user->id]);
        } catch (\Exception $e) {
            \Log::error('Failed to create user', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Failed to create client: ' . $e->getMessage());
        }

        $message = !empty($validated['skip_account_creation']) && $validated['skip_account_creation']
            ? 'Walk-in client saved successfully! Account can be created later from client view page.'
            : 'Client created successfully with login account!';

        return redirect()->route('admin.clients')->with('success', $message);
    }

    /**
     * Show client details.
     */
    public function show($id)
    {
        $client = User::where('role', 'client')
            ->with(['barangay', 'animals.species.animalType', 'animals.breed', 'animals.petRegistrations'])
            ->findOrFail($id);

        $species = Species::orderBy('species_name')->get();
        $breeds = Breed::orderBy('breed_name')->get();
        $barangays = Barangay::orderBy('name')->get();

        return Inertia::render('Admin/ClientDetails', [
            'client' => $client,
            'species' => $species,
            'breeds' => $breeds,
            'barangays' => $barangays,
        ]);
    }

    /**
     * Update client information.
     */
    public function update(Request $request, $id)
    {
        $client = User::where('role', 'client')->findOrFail($id);

        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'lastname' => 'required|string|max:255',
            'age' => 'required|integer|min:1|max:120',
            'email' => 'required|email|unique:users,email,' . $client->id,
            'phone_number' => 'nullable|string|regex:/^09\d{9}$/',
            'barangay_id' => 'required|exists:barangays,id',
            'zone' => 'required|string|max:255',
            'facebook' => 'nullable|string|max:255',
        ]);

        $validated['name'] = $validated['firstname'] . ' ' . $validated['lastname'];

        $client->update($validated);

        return redirect()->route('admin.clients.show', $client->id)
            ->with('success', 'Client information updated successfully!');
    }

    /**
     * Create login account for client with placeholder email.
     */
    public function createAccount(Request $request, $id)
    {
        $client = User::where('role', 'client')->findOrFail($id);

        // Check if client already has a real account
        if (!$client->email || !str_ends_with($client->email, '@vetcare.local')) {
            return redirect()->route('admin.clients.show', $client->id)
                ->with('error', 'This client already has a login account.');
        }

        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $client->update([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('admin.clients.show', $client->id)
            ->with('success', 'Login account created successfully! Client can now log in with their email and password.');
    }

    /**
     * Get barangays for dropdown.
     */
    public function getBarangays()
    {
        $barangays = Barangay::all();
        return response()->json($barangays);
    }

    /**
     * Store a new species.
     */
    public function storeSpecies(Request $request)
    {
        $validated = $request->validate([
            'species_name' => 'required|string|max:255',
            'type_id' => 'required|exists:animal_types,id'
        ]);

        Species::create($validated);

        return redirect()->back()->with('success', 'Species added successfully');
    }

    /**
     * Store a new breed.
     */
    public function storeBreed(Request $request)
    {
        $validated = $request->validate([
            'breed_name' => 'required|string|max:255',
            'species_id' => 'required|exists:species,id'
        ]);

        Breed::create($validated);

        return redirect()->back()->with('success', 'Breed added successfully');
    }

    /**
     * Get animal types, species, and breeds for forms.
     */
    public function getAnimalData()
    {
        $animalTypes = AnimalType::with('species.breeds')->get();
        return response()->json($animalTypes);
    }

    /**
     * Store a new pet for a client.
     */
    public function storePet(Request $request, $clientId)
    {
        $client = User::where('role', 'client')->findOrFail($clientId);

        $validated = $request->validate([
            'pet_name' => 'required|string|max:255',
            'species_id' => 'required|exists:species,id',
            'breed_id' => 'required|exists:breeds,id',
            'sex' => 'required|in:male,female',
            'color' => 'nullable|string|max:255',
            'weight' => 'nullable|numeric|min:0|max:999.99',
            'birthdate' => 'nullable|date',
            // Reproductive Status
            'reproductive_status' => 'nullable|in:pregnant,nursing,not_pregnant',
            'weeks_months' => 'nullable|string|max:50',
            // Diet
            'diet' => 'nullable|in:commercial_food,table_food,both,others',
            'diet_other' => 'nullable|string|max:255',
            // Deworming History
            'dewormed' => 'nullable|in:yes,no',
            'last_deworming_date' => 'nullable|date',
            'dewormer_name' => 'nullable|string|max:255',
            // Vaccination History
            'rabies_vaccine' => 'nullable|in:yes,no',
            'rabies_last_vaccination' => 'nullable|date',
            'dhppl_vaccine' => 'nullable|in:yes,no',
            'dhppl_last_vaccination' => 'nullable|date',
            'other_vaccine_name' => 'nullable|string|max:255',
            'other_vaccine_last_vaccination' => 'nullable|date',
        ]);

        $pet = Animal::create([
            'user_id' => $client->id,
            'pet_name' => $validated['pet_name'],
            'species_id' => $validated['species_id'],
            'breed_id' => $validated['breed_id'],
            'sex' => $validated['sex'],
            'color' => $validated['color'],
            'weight' => $validated['weight'],
            'birthdate' => $validated['birthdate'],
            // Reproductive Status
            'reproductive_status' => $validated['reproductive_status'],
            'weeks_months' => $validated['weeks_months'],
            // Diet
            'diet' => $validated['diet'],
            'diet_other' => $validated['diet_other'],
            // Deworming History
            'dewormed' => $validated['dewormed'] ?? 'no',
            'last_deworming_date' => $validated['last_deworming_date'],
            'dewormer_name' => $validated['dewormer_name'],
            // Vaccination History
            'rabies_vaccine' => $validated['rabies_vaccine'] ?? 'no',
            'rabies_last_vaccination' => $validated['rabies_last_vaccination'],
            'dhppl_vaccine' => $validated['dhppl_vaccine'] ?? 'no',
            'dhppl_last_vaccination' => $validated['dhppl_last_vaccination'],
            'other_vaccine_name' => $validated['other_vaccine_name'],
            'other_vaccine_last_vaccination' => $validated['other_vaccine_last_vaccination'],
        ]);

        return redirect()->route('admin.clients.show', $client->id)
            ->with('success', 'Animal added successfully!');
    }

    /**
     * Update an existing pet for a client.
     */
    public function updatePet(Request $request, $clientId, $petId)
    {
        $client = User::where('role', 'client')->findOrFail($clientId);
        $pet = Animal::where('id', $petId)->where('user_id', $client->id)->firstOrFail();

        $validated = $request->validate([
            'pet_name' => 'required|string|max:255',
            'species_id' => 'required|exists:species,id',
            'breed_id' => 'required|exists:breeds,id',
            'sex' => 'required|in:male,female',
            'color' => 'nullable|string|max:255',
            'weight' => 'nullable|numeric|min:0|max:999.99',
            'birthdate' => 'nullable|date',
            // Reproductive Status
            'reproductive_status' => 'nullable|in:pregnant,nursing,not_pregnant',
            'weeks_months' => 'nullable|string|max:50',
            // Diet
            'diet' => 'nullable|in:commercial_food,table_food,both,others',
            'diet_other' => 'nullable|string|max:255',
            // Deworming History
            'dewormed' => 'nullable|in:yes,no',
            'last_deworming_date' => 'nullable|date',
            'dewormer_name' => 'nullable|string|max:255',
            // Vaccination History
            'rabies_vaccine' => 'nullable|in:yes,no',
            'rabies_last_vaccination' => 'nullable|date',
            'dhppl_vaccine' => 'nullable|in:yes,no',
            'dhppl_last_vaccination' => 'nullable|date',
            'other_vaccine_name' => 'nullable|string|max:255',
            'other_vaccine_last_vaccination' => 'nullable|date',
        ]);

        $pet->update([
            'pet_name' => $validated['pet_name'],
            'species_id' => $validated['species_id'],
            'breed_id' => $validated['breed_id'],
            'sex' => $validated['sex'],
            'color' => $validated['color'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'birthdate' => $validated['birthdate'] ?? null,
            // Reproductive Status
            'reproductive_status' => $validated['reproductive_status'],
            'weeks_months' => $validated['weeks_months'],
            // Diet
            'diet' => $validated['diet'],
            'diet_other' => $validated['diet_other'],
            // Deworming History
            'dewormed' => $validated['dewormed'] ?? 'no',
            'last_deworming_date' => $validated['last_deworming_date'],
            'dewormer_name' => $validated['dewormer_name'],
            // Vaccination History
            'rabies_vaccine' => $validated['rabies_vaccine'] ?? 'no',
            'rabies_last_vaccination' => $validated['rabies_last_vaccination'],
            'dhppl_vaccine' => $validated['dhppl_vaccine'] ?? 'no',
            'dhppl_last_vaccination' => $validated['dhppl_last_vaccination'],
            'other_vaccine_name' => $validated['other_vaccine_name'],
            'other_vaccine_last_vaccination' => $validated['other_vaccine_last_vaccination'],
        ]);

        return redirect()->back()->with('success', 'Animal updated successfully!');
    }

    /**
     * Update pet registration status (approve or decline).
     * Creates/updates record in pet_registrations table.
     */
    public function updatePetStatus(Request $request, $clientId, $petId)
    {
        $client = User::where('role', 'client')->findOrFail($clientId);
        $pet = Animal::where('id', $petId)->where('user_id', $client->id)->firstOrFail();

        $validated = $request->validate([
            'registration_status' => 'required|in:registered,declined,unregistered',
        ]);

        $newStatus = $validated['registration_status'];
        $paymentTypeId = PaymentType::getId('pet_registration');
        
        // Get the fee that was in effect at the time of approval (based on approval date)
        $approvalDate = now();
        $registrationFee = $this->getHistoricalFeeForDate($paymentTypeId, $approvalDate);

        // Handle each status
        switch ($newStatus) {
            case 'registered':
                // Create or update registration as paid
                PetRegistration::updateOrCreate(
                    [
                        'animal_id' => $pet->id,
                        'client_id' => $client->id,
                    ],
                    [
                        'payment_type_id' => $paymentTypeId,
                        'amount' => $registrationFee ?? 0,
                        'status' => 'paid',
                        'payment_method' => 'Registration Approval',
                        'paid_at' => $approvalDate,
                        'notes' => 'Registration approved for ' . $pet->pet_name,
                    ]
                );
                $message = $registrationFee 
                    ? 'Pet approved and registered! Fee: ₱' . $registrationFee 
                    : 'Pet approved and registered! No fee configured.';
                break;

            case 'declined':
                // Create or update registration as cancelled
                PetRegistration::updateOrCreate(
                    [
                        'animal_id' => $pet->id,
                        'client_id' => $client->id,
                    ],
                    [
                        'payment_type_id' => $paymentTypeId,
                        'amount' => 0,
                        'status' => 'cancelled',
                        'payment_method' => null,
                        'paid_at' => null,
                        'notes' => 'Registration declined for ' . $pet->pet_name,
                    ]
                );
                $message = 'Pet registration declined.';
                break;

            case 'unregistered':
                // Remove any existing registration record
                PetRegistration::where('animal_id', $pet->id)
                    ->where('client_id', $client->id)
                    ->delete();
                $message = 'Pet marked as unregistered.';
                break;
        }

        // Reload the client with updated animals
        $client->load(['animals.species.animalType', 'animals.breed', 'animals.petRegistrations']);

        return redirect()->back()->with('success', $message);
    }

    /**
     * Get the historical fee amount that was in effect on a specific date
     */
    private function getHistoricalFeeForDate($paymentTypeId, $date)
    {
        // Get the most recent fee change before or on this date
        $historyEntry = RevenueHistory::where('payment_type_id', $paymentTypeId)
            ->where('effective_date', '<=', $date)
            ->orderBy('effective_date', 'desc')
            ->first();
        
        if ($historyEntry) {
            return $historyEntry->new_amount;
        }
        
        // Check if there's any history AFTER this date
        // If so, use the old_amount from the earliest history as the baseline
        $futureHistory = RevenueHistory::where('payment_type_id', $paymentTypeId)
            ->where('effective_date', '>', $date)
            ->orderBy('effective_date', 'asc')
            ->first();
        
        if ($futureHistory) {
            // This date is before any changes, so use the original amount (old_amount of first change)
            return $futureHistory->old_amount;
        }
        
        // If no history at all, return current amount from payment type
        $paymentType = PaymentType::find($paymentTypeId);
        return $paymentType ? $paymentType->amount : 0;
    }

    /**
     * Display the VHC (Veterinary Health Card) list.
     */
    public function vhcIndex()
    {
        $vhcRecords = \App\Models\VhcRecord::with('livestock.species')
            ->latest()
            ->get();

        // Get only livestock species (where animal type is 'Livestock')
        $livestockType = AnimalType::where('type_name', 'Livestock')->first();
        $species = $livestockType
            ? Species::where('type_id', $livestockType->id)->orderBy('species_name')->get()
            : Species::orderBy('species_name')->get();

        return Inertia::render('Admin/vhc', [
            'vhcRecords' => $vhcRecords,
            'species' => $species,
        ]);
    }

    /**
     * Display the VHC create form.
     */
    public function vhcCreate()
    {
        // Get only livestock species (where animal type is 'Livestock')
        $livestockType = AnimalType::where('type_name', 'Livestock')->first();
        $species = $livestockType
            ? Species::where('type_id', $livestockType->id)->orderBy('species_name')->get()
            : Species::orderBy('species_name')->get();

        return Inertia::render('Admin/VhcCreate', [
            'species' => $species,
        ]);
    }

    /**
     * Store a new VHC (Veterinary Health Card) record.
     */
    public function vhcStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'purpose' => 'required|string|max:255',
            'origin' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
            'livestock' => 'required|array|min:1',
            'livestock.*.species_id' => 'required|exists:species,id',
            'livestock.*.male_count' => 'required|integer|min:0',
            'livestock.*.female_count' => 'required|integer|min:0',
        ]);

        // Create VHC record
        $vhc = \App\Models\VhcRecord::create([
            'name' => $validated['name'],
            'purpose' => $validated['purpose'],
            'origin' => $validated['origin'],
            'destination' => $validated['destination'],
        ]);

        // Create livestock entries
        foreach ($validated['livestock'] as $livestock) {
            $vhc->livestock()->create($livestock);
        }

        return redirect()->route('admin.vhc.index')
            ->with('success', 'Veterinary Health Certificate created successfully!');
    }

    /**
     * Display a VHC (Veterinary Health Card) record.
     */
    public function vhcShow(\App\Models\VhcRecord $vhc)
    {
        $vhc->load('livestock.species');

        // Get only livestock species for the edit/add modals
        $livestockType = \App\Models\AnimalType::where('type_name', 'Livestock')->first();
        $species = $livestockType
            ? \App\Models\Species::where('type_id', $livestockType->id)->orderBy('species_name')->get()
            : \App\Models\Species::orderBy('species_name')->get();

        return Inertia::render('Admin/VhcView', [
            'record' => $vhc,
            'species' => $species,
        ]);
    }

    /**
     * Update a VHC (Veterinary Health Card) record.
     */
    public function vhcUpdate(Request $request, \App\Models\VhcRecord $vhc)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'purpose' => 'required|string|max:255',
            'origin' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
        ]);

        $vhc->update($validated);

        return redirect()->route('admin.vhc.show', $vhc)
            ->with('success', 'Veterinary Health Certificate updated successfully!');
    }

    /**
     * Add livestock to a VHC (Veterinary Health Card) record.
     */
    public function vhcAddLivestock(Request $request, \App\Models\VhcRecord $vhc)
    {
        $validated = $request->validate([
            'species_id' => 'required|exists:species,id',
            'male_count' => 'required|integer|min:0',
            'female_count' => 'required|integer|min:0',
        ]);

        // Create a new livestock entry
        $vhc->livestock()->create($validated);

        return redirect()->route('admin.vhc.show', $vhc)
            ->with('success', 'Livestock added successfully!');
    }

    /**
     * Display a pet history (vaccines/treatments/vitamins) timeline.
     */
    public function petHistory(Request $request, $clientId, $petId)
    {
        $client = User::where('role', 'client')->findOrFail($clientId);

        $pet = Animal::where('id', $petId)
            ->where('user_id', $client->id)
            ->with(['species.animalType', 'breed', 'animalRegistrations'])
            ->firstOrFail();

        $services = ServicesInfo::where('animal_id', $pet->id)
            ->with([
                'service',
                'service.serviceMedicines.medicine',
                'service.serviceMedicines.unit',
            ])
            ->orderByDesc('treatment_date')
            ->orderByDesc('created_at')
            ->get();

        // Prefer the newer `services_info` records if present; otherwise fall back to completed bookings.
        $history = $services->map(function (ServicesInfo $row) {
            $service = $row->service;

            return [
                'id' => $row->id,
                'service_type' => $service?->type_name ?? 'Unknown service',
                'treatment_date' => $row->treatment_date?->format('Y-m-d'),
                'created_at' => $row->created_at?->toDateTimeString(),
                'administered_by' => $row->administered_by,
                'notes' => $row->notes,
                'medicines' => $service?->serviceMedicines?->map(function ($sm) {
                    return [
                        'id' => $sm->id,
                        'medicine_name' => $sm->medicine?->name ?? 'Unknown medicine',
                        'quantity' => $sm->quantity,
                        'unit' => $sm->unit?->name ?? null,
                    ];
                })->values() ?? [],
            ];
        });

        if ($history->isEmpty()) {
            $bookings = Appointment::where('animal_id', $pet->id)
                ->where('status', 'completed')
                ->with([
                    'services',
                    'bookingMedicines.medicine',
                ])
                ->orderByDesc('appointment_date')
                ->orderByDesc('created_at')
                ->get();

            $history = $bookings->map(function (Appointment $booking) {
                return [
                    'id' => $booking->id,
                    'service_type' => $booking->services->pluck('type_name')->join(', ') ?? 'Treatment',
                    'treatment_date' => $booking->appointment_date?->format('Y-m-d'),
                    'created_at' => $booking->created_at?->toDateTimeString(),
                    'administered_by' => $booking->administered_by,
                    'notes' => $booking->notes,
                    'medicines' => $booking->bookingMedicines?->map(function ($bm) {
                        return [
                            'id' => $bm->id,
                            'medicine_name' => $bm->medicine?->name ?? 'Unknown medicine',
                            'quantity' => $bm->quantity_used,
                            'unit' => $bm->unit_name,
                        ];
                    })->values() ?? [],
                ];
            })->values();
        }

        $species = Species::orderBy('species_name')->get();
        $breeds = Breed::orderBy('breed_name')->get();

        return Inertia::render('Admin/PetHistory', [
            'client' => $client,
            'pet' => $pet,
            'history' => $history,
            'species' => $species,
            'breeds' => $breeds,
        ]);
    }
}
