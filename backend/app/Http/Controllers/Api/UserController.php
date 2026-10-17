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
        return response()->json(User::query()->select('id', 'name', 'email', 'role', 'created_at')->latest()->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'teacher'])],
            'password' => ['required', 'string', 'min:8'],
        ]);
        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);
        return response()->json(['user' => $user->only('id', 'name', 'email', 'role'), 'message' => 'User created.'], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in(['admin', 'teacher'])],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);
        if (isset($data['password']) && $data['password'] !== '') $data['password'] = Hash::make($data['password']);
        else unset($data['password']);
        $user->update($data);
        return response()->json(['user' => $user->fresh()->only('id', 'name', 'email', 'role'), 'message' => 'User updated.']);
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted.']);
    }
}
