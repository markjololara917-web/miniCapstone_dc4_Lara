<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'application' => 'ClassReady Classroom Monitoring API',
        'status' => 'running',
        'api' => '/api',
    ]);
});
