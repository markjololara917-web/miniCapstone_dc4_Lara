<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassroomRequest;
use App\Http\Resources\ClassroomResource;
use App\Models\Classroom;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function index(Request $request)
    {
        $query = Classroom::withCount(['readinessChecks', 'issueReports'])->latest();
        if ($search = $request->string('search')->toString()) {
            $query->where(fn ($q) => $q->where('room_code', 'like', "%{$search}%")
                ->orWhere('building', 'like', "%{$search}%"));
        }
        return ClassroomResource::collection($query->paginate(min((int) $request->input('per_page', 10), 100)));
    }

    public function store(ClassroomRequest $request)
    {
        $classroom = Classroom::create($request->validated());
        return (new ClassroomResource($classroom))->response()->setStatusCode(201);
    }

    public function show(Classroom $classroom)
    {
        return new ClassroomResource($classroom->loadCount(['readinessChecks', 'issueReports']));
    }

    public function update(ClassroomRequest $request, Classroom $classroom)
    {
        $classroom->update($request->validated());
        return new ClassroomResource($classroom->fresh()->loadCount(['readinessChecks', 'issueReports']));
    }

    public function destroy(Classroom $classroom)
    {
        $classroom->delete();
        return response()->json(['message' => 'Classroom deleted.']);
    }
}
