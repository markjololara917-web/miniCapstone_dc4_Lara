<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\IssueReportController;
use App\Http\Controllers\Api\ReadinessCheckController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', DashboardController::class);

    Route::get('/classrooms', [ClassroomController::class, 'index']);
    Route::get('/classrooms/{classroom}', [ClassroomController::class, 'show']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/classrooms', [ClassroomController::class, 'store']);
        Route::put('/classrooms/{classroom}', [ClassroomController::class, 'update']);
        Route::patch('/classrooms/{classroom}', [ClassroomController::class, 'update']);
        Route::delete('/classrooms/{classroom}', [ClassroomController::class, 'destroy']);
        Route::apiResource('readiness-checks', ReadinessCheckController::class)->parameters(['readiness-checks' => 'readinessCheck']);
        Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/admin/invite-code', function (\Illuminate\Http\Request $request) { return response()->json(['invite_code' => $request->user()->invite_code]); });
    });

    Route::get('/issue-reports', [IssueReportController::class, 'index']);
    Route::post('/issue-reports', [IssueReportController::class, 'store']);
    Route::get('/issue-reports/{issueReport}', [IssueReportController::class, 'show']);
    Route::post('/issue-reports/{issueReport}/response', [IssueReportController::class, 'respond']);
    Route::put('/issue-reports/{issueReport}', [IssueReportController::class, 'update']);
    Route::patch('/issue-reports/{issueReport}', [IssueReportController::class, 'update']);
    Route::delete('/issue-reports/{issueReport}', [IssueReportController::class, 'destroy']);
});
