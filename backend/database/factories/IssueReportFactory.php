<?php

namespace Database\Factories;

use App\Models\Classroom;
use App\Models\IssueReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<IssueReport> */
class IssueReportFactory extends Factory
{
    protected $model = IssueReport::class;

    public function definition(): array
    {
        return [
            'classroom_id' => Classroom::factory(),
            'reported_by' => User::factory(),
            'title' => fake()->sentence(5),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['cleanliness', 'furniture', 'electrical', 'equipment', 'safety', 'other']),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'status' => fake()->randomElement(['reported', 'assigned', 'in_progress', 'resolved']),
            'resolution_notes' => null,
        ];
    }
}
