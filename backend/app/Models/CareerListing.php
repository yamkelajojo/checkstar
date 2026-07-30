<?php

namespace App\Models;

use App\Enums\CareerType;
use Illuminate\Database\Eloquent\Model;

class CareerListing extends Model
{
    protected $guarded = ['id'];

    protected $table = 'career_listings';

    protected function casts(): array
    {
        return [
            'type' => CareerType::class,
            'is_active' => 'boolean',
            'closes_at' => 'date',
        ];
    }
}
