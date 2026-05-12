<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'is_liquid'];

    protected $casts = [
        'is_liquid' => 'boolean'
    ];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }
}
