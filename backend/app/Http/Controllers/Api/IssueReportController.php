<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IssueReportRequest;
use App\Http\Resources\IssueReportResource;
use App\Models\IssueReport;
use App\Models\User;
use Illuminate\Http\Request;

class IssueReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = IssueReport::with(['classroom', 'reporter', 'assignee']);
        if ($user->role === 'admin') {
            $query->whereHas('reporter', fn ($q) => $q->where('admin_id', $user->id));
        } elseif ($user->is_temporary_admin) {
            $query->whereHas('reporter', fn ($q) => $q->where('admin_id', $user->admin_id));
        } else {
            $query->where(fn ($q) => $q->where('reported_by', $user->id)->orWhere('assigned_to', $user->id));
        }
        if ($request->filled('status')) $query->where('status', $request->input('status'));
        if ($request->filled('priority')) $query->where('priority', $request->input('priority'));
        if ($search = $request->string('search')->toString()) $query->where(fn ($q) => $q->where('title', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%"));
        return IssueReportResource::collection($query->latest()->paginate(min((int) $request->input('per_page', 10), 100)));
    }

    public function store(IssueReportRequest $request)
    {
        abort_unless($request->user()->role === 'teacher' && !$request->user()->is_temporary_admin, 403, 'Only teacher accounts can submit issue reports.');
        $data = $request->validated();
        unset($data['status'], $data['resolution_notes'], $data['assigned_to']);
        $data['status'] = 'reported';
        $data['reported_by'] = $request->user()->id;
        $issue = IssueReport::create($data)->load(['classroom', 'reporter', 'assignee']);
        return (new IssueReportResource($issue))->response()->setStatusCode(201);
    }

    public function show(Request $request, IssueReport $issueReport)
    {
        $this->ensureCanView($request, $issueReport);
        return new IssueReportResource($issueReport->load(['classroom', 'reporter', 'assignee']));
    }

    public function update(IssueReportRequest $request, IssueReport $issueReport)
    {
        $user = $request->user();
        abort_unless($user->role === 'admin' || $user->is_temporary_admin, 403, 'Only an administrator or temporary admin can update report status.');
        $this->ensureCanView($request, $issueReport);
        $data = $request->validated();
        if ($user->is_temporary_admin) {
            $data = array_intersect_key($data, array_flip(['status', 'resolution_notes']));
        }
        if ($user->role === 'admin' && array_key_exists('assigned_to', $data)) {
            if ($data['assigned_to'] !== null) {
                $assignee = User::findOrFail($data['assigned_to']);
                abort_unless($assignee->role === 'teacher' && !$assignee->is_temporary_admin && $assignee->is_active && (int) $assignee->admin_id === (int) $user->id, 422, 'Choose an active teacher connected to your admin account.');
                $data['status'] = 'assigned';
                $data['assigned_at'] = now();
            } else {
                $data['assigned_at'] = null;
            }
        }
        $issueReport->update($data);
        return new IssueReportResource($issueReport->fresh()->load(['classroom', 'reporter', 'assignee']));
    }

    public function respond(Request $request, IssueReport $issueReport)
    {
        abort_unless($request->user()->role === 'teacher' && !$request->user()->is_temporary_admin, 403, 'Only a teacher can respond to an assignment.');
        abort_unless((int) $issueReport->assigned_to === (int) $request->user()->id, 404, 'Assignment not found.');
        $data = $request->validate(['comment' => ['required', 'string', 'max:3000']]);
        $issueReport->update(['teacher_response' => $data['comment']]);
        return new IssueReportResource($issueReport->fresh()->load(['classroom', 'reporter', 'assignee']));
    }

    public function destroy(Request $request, IssueReport $issueReport)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only the main administrator can delete reports.');
        $this->ensureCanView($request, $issueReport);
        $issueReport->delete();
        return response()->json(['message' => 'Issue report deleted.']);
    }

    private function ensureCanView(Request $request, IssueReport $issueReport): void
    {
        $user = $request->user();
        $reporter = $issueReport->reporter()->first();
        $allowed = $user->role === 'admin'
            ? $reporter && (int) $reporter->admin_id === (int) $user->id
            : ($user->is_temporary_admin
                ? $reporter && (int) $reporter->admin_id === (int) $user->admin_id
                : ((int) $issueReport->reported_by === (int) $user->id || (int) $issueReport->assigned_to === (int) $user->id));
        abort_unless($allowed, 404, 'Report not found.');
    }
}
