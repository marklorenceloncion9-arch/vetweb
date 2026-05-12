<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VhcRecord extends Model
{
    use HasFactory;

    protected $table = 'vhc_records';

    protected $fillable = [
        'name',
        'purpose',
        'origin',
        'destination',
    ];

    public function livestock()
    {
        return $this->hasMany(VhcLivestock::class, 'vhc_id');
    }
}
