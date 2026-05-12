<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Symptom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the complaints associated with this symptom.
     */
    public function complaints(): BelongsToMany
    {
        return $this->belongsToMany(Complaint::class, 'complaint_symptoms')
            ->withPivot('days_count', 'notes')
            ->withTimestamps();
    }

    /**
     * Get all symptoms as array for dropdowns
     */
    public static function getAll(): array
    {
        return self::all()->pluck('name', 'id')->toArray();
    }
}
