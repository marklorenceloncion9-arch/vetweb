<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RevenueHistory extends Model
{
    protected $table = 'revenue_history';
    
    protected $fillable = [
        'payment_type_id',
        'old_amount',
        'new_amount',
        'effective_date',
        'reason',
        'changed_by'
    ];

    protected $casts = [
        'old_amount' => 'decimal:2',
        'new_amount' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
