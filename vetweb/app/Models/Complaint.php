<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'animal_id',
        'booking_id',
        'is_bitten',
        'bite_details',
    ];

    protected $casts = [
        'is_bitten' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who filed the complaint.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the animal associated with the complaint.
     */
    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    /**
     * Get the pet associated with the complaint (backward compatibility).
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    /**
     * Get the appointment associated with this complaint.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'booking_id');
    }

    /**
     * Get the symptoms associated with this complaint.
     */
    public function symptoms(): BelongsToMany
    {
        return $this->belongsToMany(Symptom::class, 'complaint_symptoms')
            ->withPivot('days_count', 'notes')
            ->withTimestamps();
    }

    /**
     * Get complaint_symptoms pivot records.
     */
    public function complaintSymptoms()
    {
        return $this->hasMany(ComplaintSymptom::class);
    }
}
