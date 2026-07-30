<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'ingredients' => 'array',
            'prep_time' => 'integer',
            'cook_time' => 'integer',
            'servings' => 'integer',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ];
    }
}
