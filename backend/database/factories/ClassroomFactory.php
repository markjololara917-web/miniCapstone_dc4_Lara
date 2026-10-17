<?php

namespace Database\Factories;

use App\Models\Classroom;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Classroom> */
class ClassroomFactory extends Factory
{
    protected $model = Classroom::class;

    public function definition(): array
    {
        return [
            'room_code' => strtoupper(fake()->unique()->bothify('ROOM-###')),
            'building' => fake()->randomElement(['Main Building', 'North Wing', 'Science Building']),
            'floor' => fake()->randomElement(['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor']),
            'capacity' => fake()->numberBetween(20, 50),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
