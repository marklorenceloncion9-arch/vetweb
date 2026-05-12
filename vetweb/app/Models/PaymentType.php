<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_type',
        'type_name',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /**
     * Get amount by payment type.
     */
    public static function getAmount($type)
    {
        $paymentType = self::where('payment_type', $type)->first();
        return $paymentType ? $paymentType->amount : null;
    }

    /**
     * Update amount for a payment type.
     */
    public static function updateAmount($type, $amount)
    {
        return self::where('payment_type', $type)->update(['amount' => $amount]);
    }

    /**
     * Get ID by payment type.
     */
    public static function getId($type)
    {
        $paymentType = self::where('payment_type', $type)->first();
        return $paymentType ? $paymentType->id : null;
    }

    /**
     * Get payment type by type name.
     */
    public static function getByType($type)
    {
        return self::where('payment_type', $type)->first();
    }

    public function petRegistrations()
    {
        return $this->hasMany(PetRegistration::class);
    }
}
