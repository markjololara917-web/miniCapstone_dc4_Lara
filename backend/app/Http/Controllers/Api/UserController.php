<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 10), 1), 100);
        return response()->json(User::query()->where(function ($q) use ($request) { $q->where('id', $request->user()->id)->orWhere('admin_id', $request->user()->id); })->where('is_active', true)->select('id', 'name', 'email', 'role', 'admin_id', 'is_temporary_admin', 'created_at')->latest()->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['teacher'])],
            'password' => ['required', 'string', 'min:8'],
        ]);
        $data['password'] = Hash::make($data['password']);
        $data['admin_id'] = $request->user()->id;
        $user = User::create($data);
        return response()->json(['user' => $user->only('id', 'name', 'email', 'role'), 'message' => 'User created.'], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in(['teacher'])],
            'is_temporary_admin' => ['sometimes', 'boolean'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);
        if (isset($data['is_temporary_admin']) && $user->role !== 'teacher') unset($data['is_temporary_admin']);
        if (isset($data['password']) && $data['password'] !== '') $data['password'] = Hash::make($data['password']);
        else unset($data['password']);
        if ($user->role !== 'teacher' || $user->admin_id !== $request->user()->id) {
            return response()->json(['message' => 'You can only manage teachers joined to your account.'], 403);
        }
        $user->update($data);
        return response()->json(['user' => $user->fresh()->only('id', 'name', 'email', 'role'), 'message' => 'User updated.']);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->role !== 'teacher' || $user->admin_id !== $request->user()->id) {
            return response()->json(['message' => 'You can only remove teachers joined to your account.'], 403);
        }
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }
        $user->tokens()->delete();
        $user->update(['is_active' => false]);
        return response()->json(['message' => 'Teacher access revoked. Their existing reports are preserved.']);
    }
}
