<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VhcLivestock extends Model
{
    use HasFactory;

    protected $table = 'vhc_livestock';

    protected $fillable = [
        'vhc_id',
        'species_id',
        'male_count',
        'female_count',
    ];

    public function vhc(): BelongsTo
    {
        return $this->belongsTo(VhcRecord::class, 'vhc_id');
    }

    public function species(): BelongsTo
    {
        return $this->belongsTo(Species::class);
    }
}
