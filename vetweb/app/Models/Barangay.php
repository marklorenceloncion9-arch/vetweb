<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barangay extends Model
{
    /**
     * Get the users associated with this barangay.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
