<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'invite_code' => ['required', 'string'],
        ]);

        $admin = User::where('role', 'admin')->where('invite_code', strtoupper(trim($data['invite_code'])))->first();
        if (!$admin) {
            throw ValidationException::withMessages(['invite_code' => ['Invalid admin invite code. Ask the correct administrator for a valid code.']]);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'role' => 'teacher',
            'admin_id' => $admin->id,
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('classroom-monitoring')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'token' => $token,
            'user' => $user->only('id', 'name', 'email', 'role', 'admin_id', 'invite_code', 'is_temporary_admin'),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'role' => ['required', 'in:admin,teacher'],
        ]);

        $user = User::where('email', strtolower($data['email']))->first();
        if (!$user || !$user->is_active || !Hash::check($data['password'], $user->password) || $user->role !== $data['role']) {
            throw ValidationException::withMessages(['email' => ['The supplied credentials are incorrect.']]);
        }

        $token = $user->createToken('classroom-monitoring')->plainTextToken;
        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $user->only('id', 'name', 'email', 'role', 'admin_id', 'invite_code', 'is_temporary_admin'),
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()->only('id', 'name', 'email', 'role', 'admin_id', 'invite_code', 'is_temporary_admin')]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }
}
