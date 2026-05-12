<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'medicine_id',
        'quantity',
        'unit_id',
        'expiration_date',
        'volume_ml',
        'items_per_box'
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'quantity' => 'decimal:3',
        'volume_ml' => 'decimal:2'
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function isBox()
    {
        $unitName = strtolower(trim((string) ($this->unit?->name ?? '')));
        return in_array($unitName, ['box', 'boxes'], true);
    }

    public function isCapsuleOrTablet()
    {
        $unitName = strtolower(trim((string) ($this->unit?->name ?? '')));
        return in_array($unitName, ['capsule', 'capsules', 'tablet', 'tablets'], true);
    }

    public function isVial()
    {
        $unitName = strtolower(trim((string) ($this->unit?->name ?? '')));
        return in_array($unitName, ['vial', 'vials'], true);
    }

    public function getTotalItems()
    {
        if ($this->isBox() && $this->items_per_box) {
            return $this->quantity * $this->items_per_box;
        }
        return $this->quantity;
    }

    public function calculateVialDosage($dogWeightKg)
    {
        if (!$this->isVial()) {
            return 0;
        }
        
        // 1kg = 0.10ml, so dosage = weight * 0.10
        $dosageMl = $dogWeightKg * 0.10;
        
        return $dosageMl;
    }
}
