<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PetRegistration extends Model
{
    use HasFactory;

    protected $table = 'pet_registrations';

    protected $fillable = [
        'animal_id',
        'client_id',
        'payment_type_id',
        'amount',
        'status',
        'payment_method',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    public function pet()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }
}
