<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReadinessCheckRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'classroom_id' => ['required', 'integer', 'exists:classrooms,id'],
            'checked_at' => ['required', 'date'],
            'cleanliness' => ['required', Rule::in(['good', 'needs_attention', 'poor'])],
            'chairs' => ['required', Rule::in(['good', 'needs_attention', 'poor'])],
            'lights' => ['required', Rule::in(['good', 'needs_attention', 'poor'])],
            'fans' => ['required', Rule::in(['good', 'needs_attention', 'poor'])],
            'equipment' => ['required', Rule::in(['good', 'needs_attention', 'poor'])],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
