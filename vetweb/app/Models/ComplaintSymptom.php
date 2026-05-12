<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplaintSymptom extends Model
{
    use HasFactory;

    protected $table = 'complaint_symptoms';

    protected $fillable = [
        'complaint_id',
        'symptom_id',
        'days_count',
        'notes',
    ];

    protected $casts = [
        'days_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the complaint.
     */
    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }

    /**
     * Get the symptom.
     */
    public function symptom(): BelongsTo
    {
        return $this->belongsTo(Symptom::class);
    }
}
