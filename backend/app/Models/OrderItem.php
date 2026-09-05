<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $guarded = ['id'];

    /**
     * Integer-cents mirrors of the decimal price columns (mobile contract).
     */
    protected $appends = ['unit_price_cents', 'total_price_cents'];

    public function getUnitPriceCentsAttribute(): int
    {
        return (int) round(((float) $this->unit_price) * 100);
    }

    public function getTotalPriceCentsAttribute(): int
    {
        return (int) round(((float) $this->total_price) * 100);
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'product_snapshot' => 'array',
            'bought_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function storeProduct(): BelongsTo
    {
        return $this->belongsTo(StoreProduct::class);
    }
}
