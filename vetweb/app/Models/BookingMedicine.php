<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingMedicine extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'inventory_id',
        'medicine_id',
        'quantity_used',
        'unit_name',
        'dosage_ml',
    ];

    protected $casts = [
        'quantity_used' => 'decimal:3',
        'dosage_ml' => 'decimal:2',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'booking_id');
    }

    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
