<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Species extends Model
{
    protected $fillable = ['species_name', 'type_id'];

    public function animalType()
    {
        return $this->belongsTo(AnimalType::class, 'type_id');
    }

    public function breeds()
    {
        return $this->hasMany(Breed::class);
    }
}
