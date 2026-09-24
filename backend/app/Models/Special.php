<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Special extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_special')
            ->withPivot('special_price')
            ->withTimestamps();
    }

    /** Owning store; null = chain-wide (developer-created). */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** The banner that fronts this sale, if one is linked. */
    public function banner(): HasOne
    {
        return $this->hasOne(BannerCreative::class);
    }

    /** Active right now: flag on and within the date window. */
    public function scopeActiveWindow($query)
    {
        $now = now();

        return $query->where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now);
    }
}
