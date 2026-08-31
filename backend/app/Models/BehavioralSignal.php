<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BehavioralSignal extends Model
{
    protected $fillable = [
        'customer_id',
        'signal',
        'weight',
        'context',
    ];

    protected $casts = [
        'weight' => 'float',
        'context' => 'array',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
