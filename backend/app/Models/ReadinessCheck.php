<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadinessCheck extends Model
{
    protected $fillable = [
        'classroom_id', 'inspected_by', 'checked_at', 'cleanliness',
        'chairs', 'lights', 'fans', 'equipment', 'notes', 'status',
    ];

    protected function casts(): array
    {
        return ['checked_at' => 'date'];
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }
}
