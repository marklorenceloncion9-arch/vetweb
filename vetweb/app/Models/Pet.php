<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pet extends Model
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
    ];

    protected $casts = [
        'birthdate' => 'date',
        'weight' => 'decimal:2',
        'archived_at' => 'datetime',
    ];

    protected $appends = ['registration_status'];

    /**
     * Scope for active (non-archived) pets
     */
    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope for archived pets
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Check if pet is archived
     */
    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * Get the user that owns the pet.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the species of the pet.
     */
    public function species()
    {
        return $this->belongsTo(Species::class);
    }

    /**
     * Get the breed of the pet.
     */
    public function breed()
    {
        return $this->belongsTo(Breed::class);
    }

    /**
     * Get the pet registrations for the pet.
     */
    public function petRegistrations()
    {
        return $this->hasMany(PetRegistration::class, 'animal_id');
    }

    /**
     * Get the latest pet registration record.
     */
    public function latestPetRegistration()
    {
        return $this->hasOne(PetRegistration::class, 'animal_id')->latest();
    }

    /**
     * Get registration status based on pet_registrations.
     * Returns: 'registered', 'declined', or 'unregistered'
     */
    public function getRegistrationStatusAttribute()
    {
        $latest = $this->petRegistrations()->latest()->first();
        
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
