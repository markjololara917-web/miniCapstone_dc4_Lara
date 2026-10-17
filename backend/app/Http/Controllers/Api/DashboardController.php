<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardReadinessCheckResource;
use App\Http\Resources\IssueReportResource;
use App\Models\Classroom;
use App\Models\IssueReport;
use App\Models\ReadinessCheck;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $latestChecks = ReadinessCheck::with(['classroom', 'inspector'])->latest('checked_at')->take(5)->get();
        $latestIssues = IssueReport::with(['classroom', 'reporter'])->latest()->take(5)->get();

        return response()->json([
            'stats' => [
                'classrooms' => Classroom::count(),
                'ready' => ReadinessCheck::where('status', 'ready')->whereIn('id', function ($q) {
                    $q->selectRaw('MAX(id)')->from('readiness_checks')->groupBy('classroom_id');
                })->count(),
                'needs_attention' => ReadinessCheck::where('status', 'needs_attention')->whereIn('id', function ($q) {
                    $q->selectRaw('MAX(id)')->from('readiness_checks')->groupBy('classroom_id');
                })->count(),
                'open_issues' => IssueReport::whereIn('status', ['reported', 'assigned', 'in_progress'])->count(),
                'resolved_issues' => IssueReport::where('status', 'resolved')->count(),
            ],
            'latest_checks' => DashboardReadinessCheckResource::collection($latestChecks),
            'latest_issues' => IssueReportResource::collection($latestIssues),
        ]);
    }
}
