<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Models\Species;
use App\Models\Breed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnimalController extends Controller
{
    /**
     * Get all pets for authenticated user (active only by default)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $showArchived = $request->query('archived') === 'true';
        
        $query = Animal::where('user_id', $user->id)
            ->with(['species', 'breed']);
        
        if ($showArchived) {
            $query->archived();
        } else {
            $query->active();
        }
        
        $pets = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'pets' => $pets,
            'showing_archived' => $showArchived
        ]);
    }

    /**
     * Get a single pet by ID
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $pet = Animal::where('id', $id)->where('user_id', $user->id)
            ->with(['species', 'breed'])
            ->first();

        if (!$pet) {
            return response()->json([
                'success' => false,
                'error' => 'Animal not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'pet' => [
                'id' => $pet->id,
                'pet_name' => $pet->pet_name,
                'species' => $pet->species?->species_name,
                'breed' => $pet->breed?->breed_name,
                'sex' => $pet->sex,
                'color' => $pet->color,
                'weight' => $pet->weight,
                'birthdate' => $pet->birthdate,
                'archived_at' => $pet->archived_at,
            ]
        ]);
    }

    /**
     * Archive a pet (soft delete)
     */
    public function archive(Request $request, $id)
    {
        $user = $request->user();
        $pet = Animal::where('id', $id)->where('user_id', $user->id)->first();

        if (!$pet) {
            return response()->json([
                'success' => false,
                'error' => 'Animal not found'
            ], 404);
        }

        $pet->update(['archived_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Animal archived successfully'
        ]);
    }

    /**
     * Unarchive a pet (restore)
     */
    public function unarchive(Request $request, $id)
    {
        $user = $request->user();
        $pet = Animal::where('id', $id)->where('user_id', $user->id)->first();

        if (!$pet) {
            return response()->json([
                'success' => false,
                'error' => 'Animal not found'
            ], 404);
        }

        $pet->update(['archived_at' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Animal restored successfully'
        ]);
    }

    /**
     * Add a new pet (modal style - simple creation)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'pet_name' => 'required|string|max:255',
            'species_id' => 'required|exists:species,id',
            'breed_id' => 'required|exists:breeds,id',
            'sex' => 'required|in:male,female',
            'color' => 'nullable|string|max:255',
            'weight' => 'nullable|numeric|min:0|max:999.99',
            'birthdate' => 'nullable|date',
            'reproductive_status' => 'nullable|in:pregnant,nursing,not_pregnant',
            'weeks_months' => 'nullable|string|max:50',
            'diet' => 'nullable|in:commercial_food,table_food,both,others',
            'diet_other' => 'nullable|string|max:255',
            'dewormed' => 'nullable|in:yes,no',
            'last_deworming_date' => 'nullable|date',
            'dewormer_name' => 'nullable|string|max:255',
            'rabies_vaccine' => 'nullable|in:yes,no',
            'rabies_last_vaccination' => 'nullable|date',
            'dhppl_vaccine' => 'nullable|in:yes,no',
            'dhppl_last_vaccination' => 'nullable|date',
            'other_vaccine_name' => 'nullable|string|max:255',
            'other_vaccine_last_vaccination' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Check if species is livestock or poultry (no registration needed)
        $species = \App\Models\Species::with('animalType')->find($request->species_id);
        $isExempt = $species && $species->animalType && in_array($species->animalType->type_name, ['Livestock', 'Poultry']);
        
        $pet = Animal::create([
            'user_id' => $user->id,
            'pet_name' => $request->pet_name,
            'species_id' => $request->species_id,
            'breed_id' => $request->breed_id,
            'sex' => $request->sex,
            'color' => $request->color,
            'weight' => $request->weight,
            'birthdate' => $request->birthdate,
            'registration_status' => $isExempt ? 'exempt' : 'unregistered',
            'reproductive_status' => $request->reproductive_status,
            'weeks_months' => $request->weeks_months,
            'diet' => $request->diet,
            'diet_other' => $request->diet_other,
            'dewormed' => $request->dewormed,
            'last_deworming_date' => $request->last_deworming_date,
            'dewormer_name' => $request->dewormer_name,
            'rabies_vaccine' => $request->rabies_vaccine,
            'rabies_last_vaccination' => $request->rabies_last_vaccination,
            'dhppl_vaccine' => $request->dhppl_vaccine,
            'dhppl_last_vaccination' => $request->dhppl_last_vaccination,
            'other_vaccine_name' => $request->other_vaccine_name,
            'other_vaccine_last_vaccination' => $request->other_vaccine_last_vaccination,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Animal added successfully',
            'pet' => $pet->load(['species', 'breed'])
        ], 201);
    }

    /**
     * Update a pet
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        if (!$user) {
            \Log::error('Animal update: No authenticated user');
            return response()->json([
                'success' => false,
                'error' => 'Not authenticated'
            ], 401);
        }
        
        $pet = Animal::where('id', $id)->where('user_id', $user->id)->first();

        if (!$pet) {
            \Log::error('Animal update: Animal not found or not owned by user', ['animal_id' => $id, 'user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'error' => 'Animal not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'pet_name' => 'sometimes|string|max:255',
            'species_id' => 'sometimes|exists:species,id',
            'breed_id' => 'sometimes|exists:breeds,id',
            'sex' => 'sometimes|in:male,female',
            'color' => 'sometimes|string|max:255',
            'weight' => 'sometimes|numeric|min:0',
            'birthdate' => 'sometimes|date',
            'reproductive_status' => 'sometimes|in:pregnant,nursing,not_pregnant',
            'weeks_months' => 'sometimes|string|max:50',
            'diet' => 'sometimes|in:commercial_food,table_food,both,others',
            'diet_other' => 'sometimes|string|max:255',
            'dewormed' => 'sometimes|in:yes,no',
            'last_deworming_date' => 'sometimes|date',
            'dewormer_name' => 'sometimes|string|max:255',
            'rabies_vaccine' => 'sometimes|in:yes,no',
            'rabies_last_vaccination' => 'sometimes|date',
            'dhppl_vaccine' => 'sometimes|in:yes,no',
            'dhppl_last_vaccination' => 'sometimes|date',
            'other_vaccine_name' => 'sometimes|string|max:255',
            'other_vaccine_last_vaccination' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $pet->update($request->only([
            'pet_name', 'species_id', 'breed_id', 'sex', 'color', 'weight', 'birthdate',
            'reproductive_status', 'weeks_months', 'diet', 'diet_other', 'dewormed',
            'last_deworming_date', 'dewormer_name', 'rabies_vaccine', 'rabies_last_vaccination',
            'dhppl_vaccine', 'dhppl_last_vaccination', 'other_vaccine_name', 'other_vaccine_last_vaccination'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Animal updated successfully',
            'pet' => $pet->load(['species', 'breed'])
        ]);
    }

    /**
     * Get species list for dropdown
     */
    public function getSpecies()
    {
        $species = Species::orderBy('species_name')->get(['id', 'species_name as name']);

        return response()->json([
            'success' => true,
            'species' => $species
        ]);
    }

    /**
     * Get breeds by species for dropdown
     */
    public function getBreedsBySpecies($speciesId)
    {
        $breeds = Breed::where('species_id', $speciesId)
            ->orderBy('breed_name')
            ->get(['id', 'breed_name as name']);

        return response()->json([
            'success' => true,
            'breeds' => $breeds
        ]);
    }

    /**
     * Permanently delete a pet
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $pet = Animal::where('id', $id)->where('user_id', $user->id)->first();

        if (!$pet) {
            return response()->json([
                'success' => false,
                'error' => 'Animal not found'
            ], 404);
        }

        $pet->delete();

        return response()->json([
            'success' => true,
            'message' => 'Animal deleted permanently'
        ]);
    }
}
