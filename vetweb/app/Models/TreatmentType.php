<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TreatmentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'type_name',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all treatment types as an array for dropdowns
     */
    public static function getAllTypes()
    {
        return self::all()->pluck('type_name', 'id');
    }

    /**
     * Get treatment type ID by name
     */
    public static function getIdByName(string $name): ?int
    {
        $type = self::where('type_name', $name)->first();
        return $type ? $type->id : null;
    }

    /**
     * Get appointments for this treatment type.
     */
    public function appointments(): BelongsToMany
    {
        return $this->belongsToMany(Appointment::class, 'appointment_treatment_types')
            ->withTimestamps();
    }
}
