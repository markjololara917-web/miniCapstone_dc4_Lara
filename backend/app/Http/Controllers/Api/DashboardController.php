<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardReadinessCheckResource;
use App\Http\Resources\IssueReportResource;
use App\Models\Classroom;
use App\Models\IssueReport;
use App\Models\ReadinessCheck;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $issueQuery = IssueReport::query()->whereHas('reporter', function ($q) use ($user) {
            if ($user->role === 'admin') $q->where('admin_id', $user->id);
            elseif ($user->is_temporary_admin) $q->where('admin_id', $user->admin_id);
            else $q->where('id', $user->id);
        });
        $organizationIssueQuery = IssueReport::query()->whereHas('reporter', function ($q) use ($user) {
            if ($user->role === 'admin') $q->where('admin_id', $user->id);
            else $q->where('admin_id', $user->admin_id);
        });
        $latestChecks = ($user->role === 'admin' || $user->is_temporary_admin) ? ReadinessCheck::with(['classroom', 'inspector'])->latest('checked_at')->take(5)->get() : collect();
        $latestIssues = (clone $issueQuery)->with(['classroom', 'reporter'])->latest()->take(5)->get();

        return response()->json([
            'stats' => [
                'classrooms' => Classroom::count(),
                'teachers' => User::where('admin_id', $user->role === 'admin' ? $user->id : $user->admin_id)->where('role', 'teacher')->where('is_active', true)->count(),
                'reports' => (clone $organizationIssueQuery)->count(),
                'ready' => ReadinessCheck::where('status', 'ready')->whereIn('id', function ($q) {
                    $q->selectRaw('MAX(id)')->from('readiness_checks')->groupBy('classroom_id');
                })->count(),
                'needs_attention' => ReadinessCheck::where('status', 'needs_attention')->whereIn('id', function ($q) {
                    $q->selectRaw('MAX(id)')->from('readiness_checks')->groupBy('classroom_id');
                })->count(),
                'open_issues' => (clone $organizationIssueQuery)->whereIn('status', ['reported', 'assigned', 'in_progress'])->count(),
                'resolved_issues' => (clone $organizationIssueQuery)->where('status', 'resolved')->count(),
            ],
            'latest_checks' => DashboardReadinessCheckResource::collection($latestChecks),
            'latest_issues' => IssueReportResource::collection($latestIssues),
        ]);
    }
}
