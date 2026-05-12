<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $table = 'services';

    protected $fillable = [
        'type_name',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all services as an array for dropdowns
     */
    public static function getAllTypes()
    {
        return self::all()->pluck('type_name', 'id');
    }

    /**
     * Get service ID by name
     */
    public static function getIdByName(string $name): ?int
    {
        $service = self::where('type_name', $name)->first();
        return $service ? $service->id : null;
    }

    /**
     * Get appointments for this service.
     */
    public function appointments(): BelongsToMany
    {
        return $this->belongsToMany(Appointment::class, 'booking_services', 'treatment_type_id', 'booking_id')
            ->withTimestamps();
    }

    /**
     * Get medicines required for this service.
     */
    public function serviceMedicines(): HasMany
    {
        return $this->hasMany(ServiceMedicine::class);
    }

    /**
     * Get medicines through service_medicines relationship.
     */
    public function medicines(): BelongsToMany
    {
        return $this->belongsToMany(Medicine::class, 'service_medicines')
            ->withPivot('quantity', 'unit_id')
            ->withTimestamps();
    }
}
