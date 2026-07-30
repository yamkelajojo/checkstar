<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiderBadge extends Model
{
    protected $guarded = ['id'];

    public $timestamps = false;

    protected $table = 'rider_badges';

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'awarded_at' => 'datetime',
        ];
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }
}
