<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnimalType extends Model
{
    protected $fillable = ['type_name'];

    public function species()
    {
        return $this->hasMany(Species::class, 'type_id');
    }
}
