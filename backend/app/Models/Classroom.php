<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = ['room_code', 'building', 'floor', 'capacity', 'notes'];

    protected function casts(): array
    {
        return ['capacity' => 'integer'];
    }

    public function readinessChecks(): HasMany
    {
        return $this->hasMany(ReadinessCheck::class);
    }

    public function issueReports(): HasMany
    {
        return $this->hasMany(IssueReport::class);
    }
}
