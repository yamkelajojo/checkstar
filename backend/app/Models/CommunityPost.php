<?php

namespace App\Models;

use App\Enums\CommunityPostCategory;
use Illuminate\Database\Eloquent\Model;

class CommunityPost extends Model
{
    protected $guarded = ['id'];

    protected $table = 'community_posts';

    protected function casts(): array
    {
        return [
            'category' => CommunityPostCategory::class,
            'event_date' => 'date',
            'is_published' => 'boolean',
        ];
    }
}
