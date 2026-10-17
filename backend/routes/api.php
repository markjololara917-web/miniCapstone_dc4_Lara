<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\IssueReportController;
use App\Http\Controllers\Api\ReadinessCheckController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', DashboardController::class);

    Route::apiResource('classrooms', ClassroomController::class);
    Route::apiResource('readiness-checks', ReadinessCheckController::class)
        ->parameters(['readiness-checks' => 'readinessCheck']);
    Route::apiResource('issue-reports', IssueReportController::class)
        ->parameters(['issue-reports' => 'issueReport']);

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    });
});
