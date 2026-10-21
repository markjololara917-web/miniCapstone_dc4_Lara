<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'role', 'password', 'admin_id', 'invite_code', 'is_active', 'is_temporary_admin'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'is_temporary_admin' => 'boolean', 'is_active' => 'boolean'];
    }

    public function readinessChecks()
    {
        return $this->hasMany(ReadinessCheck::class, 'inspected_by');
    }

    public function issueReports()
    {
        return $this->hasMany(IssueReport::class, 'reported_by');
    }

    public function teachers()
    {
        return $this->hasMany(User::class, 'admin_id');
    }

    public function administrator()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
