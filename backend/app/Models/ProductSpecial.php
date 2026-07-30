<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSpecial extends Model
{
    protected $guarded = ['id'];

    protected $table = 'product_special';

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function special(): BelongsTo
    {
        return $this->belongsTo(Special::class);
    }
}
