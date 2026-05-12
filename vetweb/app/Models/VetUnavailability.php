<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VetUnavailability extends Model
{
    use HasFactory;

    protected $table = 'vet_unavailabilities';

    protected $fillable = [
        'unavailable_date',
        'reason',
        'type',
        'created_by',
    ];

    protected $casts = [
        'unavailable_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all unavailable dates as an array of date strings
     */
    public static function getUnavailableDates(): array
    {
        return self::pluck('unavailable_date')->map(function ($date) {
            return $date->format('Y-m-d');
        })->toArray();
    }

    /**
     * Check if a specific date is unavailable
     */
    public static function isUnavailable(string $date): bool
    {
        return self::where('unavailable_date', $date)->exists();
    }

    /**
     * Get unavailable dates for a date range
     */
    public static function getUnavailableForRange(string $startDate, string $endDate): array
    {
        return self::whereBetween('unavailable_date', [$startDate, $endDate])
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->unavailable_date->format('Y-m-d'),
                    'reason' => $item->reason,
                    'type' => $item->type,
                ];
            })
            ->toArray();
    }
}
