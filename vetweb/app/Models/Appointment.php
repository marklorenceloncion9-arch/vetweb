<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory;

    protected $table = 'bookings';

    protected $fillable = [
        'user_id',
        'animal_id',
        'treatment_type_id',
        'appointment_date',
        'appointment_time',
        'status',
        'notes',
        'administered_by',
        'appointment_type',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'appointment_time' => 'datetime',
        'appointment_type' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who booked the appointment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the animal for this appointment.
     */
    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    /**
     * Get the pet for this appointment (backward compatibility).
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    /**
     * Get the service (legacy single relationship).
     */
    public function treatmentType(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'treatment_type_id');
    }

    /**
     * Get the service (new relationship).
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'treatment_type_id');
    }

    /**
     * Get all services for this appointment.
     */
    public function treatmentTypes(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'booking_services', 'booking_id', 'treatment_type_id')
            ->withTimestamps();
    }

    /**
     * Get all services for this appointment (new relationship).
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'booking_services', 'booking_id', 'treatment_type_id')
            ->withTimestamps();
    }

    /**
     * Get the complaint associated with this appointment.
     */
    public function complaint(): HasOne
    {
        return $this->hasOne(Complaint::class, 'booking_id');
    }

    /**
     * Get medicines actually administered for this booking.
     */
    public function bookingMedicines(): HasMany
    {
        return $this->hasMany(BookingMedicine::class, 'booking_id');
    }
}
