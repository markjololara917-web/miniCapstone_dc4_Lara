<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\IssueReport;
use App\Models\ReadinessCheck;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@classready.test'],
            [
                'name' => 'System Administrator',
                'role' => 'admin',
                'invite_code' => 'CLASSREADY26',
                'password' => Hash::make('Admin12345!'),
            ]
        );

        $teachers = collect();

        $teachers->push(
            User::updateOrCreate(
                ['email' => 'teacher@classready.test'],
                [
                    'name' => 'Demo Teacher',
                    'role' => 'teacher',
                    'admin_id' => $admin->id,
                    'password' => Hash::make('Teacher12345!'),
                ]
            )
        );

        for ($i = 1; $i <= 20; $i++) {
            $teachers->push(
                User::updateOrCreate(
                    ['email' => "teacher{$i}@classready.test"],
                    [
                        'name' => "Demo Teacher {$i}",
                        'role' => 'teacher',
                        'admin_id' => $admin->id,
                        'password' => Hash::make('Teacher12345!'),
                    ]
                )
            );
        }

        $buildings = [
            'Main Building',
            'North Wing',
            'Science Building',
            'Computer Building',
            'South Building',
        ];

        $rooms = [];

        for ($i = 1; $i <= 30; $i++) {
            $buildingIndex = ($i - 1) % count($buildings);
            $roomNumber = 100 + $i;

            $rooms[] = Classroom::updateOrCreate(
                ['room_code' => "ROOM-{$roomNumber}"],
                [
                    'building' => $buildings[$buildingIndex],
                    'floor' => match (true) {
                        $i <= 10 => '1st Floor',
                        $i <= 20 => '2nd Floor',
                        default => '3rd Floor',
                    },
                    'capacity' => [25, 30, 35, 40][$i % 4],
                    'notes' => $i % 5 === 0
                        ? 'Requires regular inspection'
                        : 'General classroom',
                ]
            );
        }

        $categories = [
            'electrical',
            'furniture',
            'cleanliness',
            'equipment',
            'maintenance',
        ];

        $statuses = [
            'reported',
            'in_progress',
            'resolved',
        ];

        foreach ($rooms as $index => $room) {
            $teacher = $teachers[$index % $teachers->count()];

            ReadinessCheck::updateOrCreate(
                [
                    'classroom_id' => $room->id,
                    'notes' => 'Automatic demo inspection',
                ],
                [
                    'inspected_by' => $teacher->id,
                    'checked_at' => now()
                        ->subDays($index % 30)
                        ->toDateString(),
                    'cleanliness' => $index % 5 === 0
                        ? 'needs_attention'
                        : 'good',
                    'chairs' => $index % 7 === 0
                        ? 'needs_attention'
                        : 'good',
                    'lights' => $index % 9 === 0
                        ? 'poor'
                        : 'good',
                    'fans' => $index % 6 === 0
                        ? 'poor'
                        : 'good',
                    'equipment' => $index % 8 === 0
                        ? 'needs_attention'
                        : 'good',
                    'notes' => 'Automatic demo inspection',
                    'status' => $index % 5 === 0
                        ? 'needs_attention'
                        : 'ready',
                ]
            );
        }

        for ($i = 1; $i <= 40; $i++) {
            $room = $rooms[($i - 1) % count($rooms)];
            $teacher = $teachers[($i - 1) % $teachers->count()];

            IssueReport::updateOrCreate(
                [
                    'title' => "Demo Issue {$i}",
                    'classroom_id' => $room->id,
                ],
                [
                    'reported_by' => $teacher->id,
                    'description' => "Sample maintenance issue {$i} in {$room->room_code}.",
                    'category' => $categories[($i - 1) % count($categories)],
                    'priority' => ['low', 'medium', 'high'][$i % 3],
                    'status' => $statuses[($i - 1) % count($statuses)],
                ]
            );
        }
    }
}