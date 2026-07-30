<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Rider extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
            'max_radius_km' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'banking_details' => 'array',
            'total_deliveries' => 'integer',
            'average_rating' => 'decimal:2',
            'xp' => 'integer',
            'level' => 'integer',
            'suspended_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(RiderLocation::class);
    }

    public function badges(): HasMany
    {
        return $this->hasMany(RiderBadge::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function recalculateStats(): void
    {
        $this->average_rating = round((float) $this->reviews()->avg('rating'), 2);
        $this->total_deliveries = $this->reviews()->count();
        $this->save();
    }
}
