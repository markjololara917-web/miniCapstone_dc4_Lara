<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardReadinessCheckResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'classroom' => $this->classroom?->room_code,
            'inspector' => $this->inspector?->name,
            'checked_at' => $this->checked_at?->format('Y-m-d'),
            'status' => $this->status,
        ];
    }
}
