<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Animal extends Model
{
    use HasFactory;

    protected $table = 'animals';

    protected $fillable = [
        'user_id',
        'pet_name',
        'species_id',
        'breed_id',
        'sex',
        'color',
        'weight',
        'birthdate',
        'archived_at',
        'registration_status',
        // Reproductive Status
        'reproductive_status',
        'weeks_months',
        // Diet
        'diet',
        'diet_other',
        // Deworming History
        'dewormed',
        'last_deworming_date',
        'dewormer_name',
        // Vaccination History
        'rabies_vaccine',
        'rabies_last_vaccination',
        'dhppl_vaccine',
        'dhppl_last_vaccination',
        'other_vaccine_name',
        'other_vaccine_last_vaccination',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'weight' => 'decimal:2',
        'archived_at' => 'datetime',
        'last_deworming_date' => 'date',
        'rabies_last_vaccination' => 'date',
        'dhppl_last_vaccination' => 'date',
        'other_vaccine_last_vaccination' => 'date',
    ];

    protected $appends = ['registration_status'];

    /**
     * Scope for active (non-archived) animals
     */
    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope for archived animals
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Check if animal is archived
     */
    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * Get the user that owns the animal.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the species of the animal.
     */
    public function species()
    {
        return $this->belongsTo(Species::class);
    }

    /**
     * Get the breed of the animal.
     */
    public function breed()
    {
        return $this->belongsTo(Breed::class);
    }

    /**
     * Get the animal registrations for the animal.
     */
    public function animalRegistrations()
    {
        return $this->hasMany(AnimalRegistration::class, 'animal_id');
    }

    /**
     * Get the pet registrations for the animal (backward compatibility).
     */
    public function petRegistrations()
    {
        return $this->hasMany(PetRegistration::class, 'animal_id');
    }

    /**
     * Get the latest animal registration record.
     */
    public function latestAnimalRegistration()
    {
        return $this->hasOne(AnimalRegistration::class, 'animal_id')->latest();
    }

    /**
     * Get the latest pet registration record (backward compatibility).
     */
    public function latestPetRegistration()
    {
        return $this->hasOne(PetRegistration::class, 'animal_id')->latest();
    }

    /**
     * Get registration status based on the latest pet registration.
     * Returns: 'registered', 'declined', 'unregistered', or 'exempt'
     * Livestock and Poultry animals are exempt from registration.
     */
    public function getRegistrationStatusAttribute()
    {
        // Check if animal is livestock or poultry (no registration needed)
        if ($this->species && $this->species->animalType) {
            $typeName = $this->species->animalType->type_name;
            if (in_array($typeName, ['Livestock', 'Poultry'])) {
                return 'exempt';
            }
        }
        
        $latest = $this->animalRegistrations()->latest()->first();
        
        if (!$latest) {
            return 'unregistered';
        }
        
        return match($latest->status) {
            'paid' => 'registered',
            'cancelled' => 'declined',
            'pending' => 'unregistered',
            default => 'unregistered',
        };
    }
}
