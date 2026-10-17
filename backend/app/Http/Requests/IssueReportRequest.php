<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IssueReportRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'classroom_id' => ['required', 'integer', 'exists:classrooms,id'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string', 'max:5000'],
            'category' => ['required', Rule::in(['cleanliness', 'furniture', 'electrical', 'equipment', 'safety', 'other'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['sometimes', Rule::in(['reported', 'assigned', 'in_progress', 'resolved'])],
            'resolution_notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
