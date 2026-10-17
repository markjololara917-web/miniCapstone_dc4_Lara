<?php

namespace Database\Factories;

use App\Models\Classroom;
use App\Models\ReadinessCheck;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ReadinessCheck> */
class ReadinessCheckFactory extends Factory
{
    protected $model = ReadinessCheck::class;

    public function definition(): array
    {
        $items = ['good', 'needs_attention', 'poor'];
        $conditions = [
            'cleanliness' => fake()->randomElement($items),
            'chairs' => fake()->randomElement($items),
            'lights' => fake()->randomElement($items),
            'fans' => fake()->randomElement($items),
            'equipment' => fake()->randomElement($items),
        ];
        return [
            'classroom_id' => Classroom::factory(),
            'inspected_by' => User::factory(),
            'checked_at' => fake()->date(),
            ...$conditions,
            'notes' => fake()->optional()->sentence(),
            'status' => in_array('poor', $conditions, true) || in_array('needs_attention', $conditions, true) ? 'needs_attention' : 'ready',
        ];
    }
}
