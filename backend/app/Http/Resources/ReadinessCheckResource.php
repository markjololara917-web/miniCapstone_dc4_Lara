<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReadinessCheckResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'classroom_id' => $this->classroom_id,
            'classroom' => $this->whenLoaded('classroom', fn () => [
                'id' => $this->classroom->id,
                'room_code' => $this->classroom->room_code,
                'building' => $this->classroom->building,
            ]),
            'inspector' => $this->whenLoaded('inspector', fn () => [
                'id' => $this->inspector->id,
                'name' => $this->inspector->name,
            ]),
            'checked_at' => $this->checked_at?->format('Y-m-d'),
            'cleanliness' => $this->cleanliness,
            'chairs' => $this->chairs,
            'lights' => $this->lights,
            'fans' => $this->fans,
            'equipment' => $this->equipment,
            'notes' => $this->notes,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
