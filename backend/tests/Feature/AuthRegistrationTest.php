<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_create_a_teacher_account_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test Teacher',
            'email' => 'test.teacher@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'token', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('user.role', 'teacher');

        $this->assertDatabaseHas('users', [
            'email' => 'test.teacher@example.com',
            'role' => 'teacher',
        ]);
    }

    public function test_registration_rejects_duplicate_emails(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Another Teacher',
            'email' => 'taken@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_registration_rejects_mismatched_password_confirmation(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Test Teacher',
            'email' => 'test.teacher@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }
}
