<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Treatment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'animal_id',
        'treatment_type_id',
        'complaint_id',
        'administered_by',
        'notes',
        'treatment_date',
    ];

    protected $casts = [
        'treatment_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the appointment.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'booking_id');
    }

    /**
     * Get the animal.
     */
    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    /**
     * Get the pet (backward compatibility).
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    /**
     * Get the treatment type.
     */
    public function treatmentType(): BelongsTo
    {
        return $this->belongsTo(TreatmentType::class);
    }

    /**
     * Get the complaint (if linked).
     */
    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }
}
