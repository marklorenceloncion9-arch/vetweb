<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    use HasFactory;

    protected $table = 'inventory_logs';

    protected $fillable = [
        'medicine_id',
        'inventory_id',
        'change_qty',
        'type'
    ];

    public $timestamps = true;
    const UPDATED_AT = null;

    protected $casts = [
        'change_qty' => 'decimal:2',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}
