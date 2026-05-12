<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentTreatmentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'treatment_type_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the appointment that owns this treatment type.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'booking_id');
    }

    /**
     * Get the treatment type.
     */
    public function treatmentType(): BelongsTo
    {
        return $this->belongsTo(TreatmentType::class);
    }
}
