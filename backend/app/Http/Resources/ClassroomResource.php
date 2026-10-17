<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassroomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'room_code' => $this->room_code,
            'building' => $this->building,
            'floor' => $this->floor,
            'capacity' => $this->capacity,
            'notes' => $this->notes,
            'readiness_checks_count' => $this->whenCounted('readinessChecks'),
            'issue_reports_count' => $this->whenCounted('issueReports'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
