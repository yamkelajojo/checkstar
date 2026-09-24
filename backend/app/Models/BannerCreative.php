<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BannerCreative extends Model
{
    protected $fillable = [
        'name',
        'store_id',
        'special_id',
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

    /**
     * The sale this banner fronts, when it is a sale banner rather than a
     * standalone branding banner.
     */
    public function special(): BelongsTo
    {
        return $this->belongsTo(Special::class);
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
