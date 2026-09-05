<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $guarded = ['id'];

    /**
     * Integer-cents mirrors of the decimal money columns. Clients (the mobile
     * app) price in cents; emitting derived ints keeps the DB decimal-canonical
     * while the JSON contract carries exact, float-free money.
     */
    protected $appends = ['subtotal_cents', 'delivery_fee_cents', 'total_cents'];

    public function getSubtotalCentsAttribute(): int
    {
        return (int) round(((float) $this->subtotal) * 100);
    }

    public function getDeliveryFeeCentsAttribute(): int
    {
        return (int) round(((float) $this->delivery_fee) * 100);
    }

    public function getTotalCentsAttribute(): int
    {
        return (int) round(((float) $this->total) * 100);
    }

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'delivery_latitude' => 'decimal:7',
            'delivery_longitude' => 'decimal:7',
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'total' => 'decimal:2',
            'rider_rating' => 'integer',
            'customer_confirmed_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(OrderActivityLog::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
