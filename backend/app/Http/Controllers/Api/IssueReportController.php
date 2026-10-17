<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IssueReportRequest;
use App\Http\Resources\IssueReportResource;
use App\Models\IssueReport;
use Illuminate\Http\Request;

class IssueReportController extends Controller
{
    public function index(Request $request)
    {
        $query = IssueReport::with(['classroom', 'reporter'])->latest();
        if ($request->filled('status')) $query->where('status', $request->input('status'));
        if ($request->filled('priority')) $query->where('priority', $request->input('priority'));
        if ($search = $request->string('search')->toString()) {
            $query->where(fn ($q) => $q->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%"));
        }
        return IssueReportResource::collection($query->paginate(min((int) $request->input('per_page', 10), 100)));
    }

    public function store(IssueReportRequest $request)
    {
        $data = $request->validated();
        $data['reported_by'] = $request->user()->id;
        $issue = IssueReport::create($data)->load(['classroom', 'reporter']);
        return (new IssueReportResource($issue))->response()->setStatusCode(201);
    }

    public function show(IssueReport $issueReport)
    {
        return new IssueReportResource($issueReport->load(['classroom', 'reporter']));
    }

    public function update(IssueReportRequest $request, IssueReport $issueReport)
    {
        $issueReport->update($request->validated());
        return new IssueReportResource($issueReport->fresh()->load(['classroom', 'reporter']));
    }

    public function destroy(IssueReport $issueReport)
    {
        $issueReport->delete();
        return response()->json(['message' => 'Issue report deleted.']);
    }
}
