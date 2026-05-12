<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentService extends Model
{
    use HasFactory;

    protected $table = 'booking_services';

    protected $fillable = [
        'booking_id',
        'treatment_type_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the appointment that owns this service.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'booking_id');
    }

    /**
     * Get the service.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'treatment_type_id', 'id');
    }

    /**
     * Get the treatment type (legacy relationship for backward compatibility).
     */
    public function treatmentType(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'treatment_type_id');
    }
}
