<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassroomRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        $routeValue = $this->route('classroom');
        $id = is_object($routeValue) && isset($routeValue->id) ? $routeValue->id : $routeValue;
        return [
            'room_code' => ['required', 'string', 'max:50', Rule::unique('classrooms', 'room_code')->ignore($id)],
            'building' => ['required', 'string', 'max:120'],
            'floor' => ['nullable', 'string', 'max:80'],
            'capacity' => ['required', 'integer', 'min:0', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
