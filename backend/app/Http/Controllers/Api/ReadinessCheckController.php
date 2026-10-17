<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReadinessCheckRequest;
use App\Http\Resources\ReadinessCheckResource;
use App\Models\ReadinessCheck;
use Illuminate\Http\Request;

class ReadinessCheckController extends Controller
{
    public function index(Request $request)
    {
        $query = ReadinessCheck::with(['classroom', 'inspector'])->latest('checked_at');
        if ($request->filled('classroom_id')) $query->where('classroom_id', $request->integer('classroom_id'));
        if ($request->filled('status')) $query->where('status', $request->input('status'));
        return ReadinessCheckResource::collection($query->paginate(min((int) $request->input('per_page', 10), 100)));
    }

    public function store(ReadinessCheckRequest $request)
    {
        $data = $request->validated();
        $data['inspected_by'] = $request->user()->id;
        $data['status'] = collect(['cleanliness', 'chairs', 'lights', 'fans', 'equipment'])
            ->contains(fn ($field) => $data[$field] !== 'good') ? 'needs_attention' : 'ready';
        $check = ReadinessCheck::create($data)->load(['classroom', 'inspector']);
        return (new ReadinessCheckResource($check))->response()->setStatusCode(201);
    }

    public function show(ReadinessCheck $readinessCheck)
    {
        return new ReadinessCheckResource($readinessCheck->load(['classroom', 'inspector']));
    }

    public function update(ReadinessCheckRequest $request, ReadinessCheck $readinessCheck)
    {
        $data = $request->validated();
        $data['status'] = collect(['cleanliness', 'chairs', 'lights', 'fans', 'equipment'])
            ->contains(fn ($field) => $data[$field] !== 'good') ? 'needs_attention' : 'ready';
        $readinessCheck->update($data);
        return new ReadinessCheckResource($readinessCheck->fresh()->load(['classroom', 'inspector']));
    }

    public function destroy(ReadinessCheck $readinessCheck)
    {
        $readinessCheck->delete();
        return response()->json(['message' => 'Readiness check deleted.']);
    }
}
