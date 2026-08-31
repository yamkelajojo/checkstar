<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BannerCreative extends Model
{
    protected $fillable = [
        'name',
        'store_id',
        'created_by',
        'slides',
        'status',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'slides' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePublished($query)
    {
        $now = now();
        return $query->where('status', 'published')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            });
    }
}
