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
            ['name' => 'System Administrator', 'role' => 'admin', 'invite_code' => 'CLASSREADY26', 'password' => Hash::make('Admin12345!')]
        );
        $teacher = User::updateOrCreate(
            ['email' => 'teacher@classready.test'],
            ['name' => 'Demo Teacher', 'role' => 'teacher', 'admin_id' => $admin->id, 'password' => Hash::make('Teacher12345!')]
        );

        $rooms = [
            ['room_code' => 'ROOM-101', 'building' => 'Main Building', 'floor' => '1st Floor', 'capacity' => 40, 'notes' => 'General classroom'],
            ['room_code' => 'ROOM-108', 'building' => 'Main Building', 'floor' => '1st Floor', 'capacity' => 35, 'notes' => null],
            ['room_code' => 'ROOM-204', 'building' => 'North Wing', 'floor' => '2nd Floor', 'capacity' => 40, 'notes' => null],
            ['room_code' => 'LAB-03', 'building' => 'Science Building', 'floor' => 'Ground Floor', 'capacity' => 30, 'notes' => 'Science laboratory'],
        ];
        foreach ($rooms as $roomData) {
            $room = Classroom::updateOrCreate(['room_code' => $roomData['room_code']], $roomData);
            if (!$room->readinessChecks()->exists()) {
                ReadinessCheck::create([
                    'classroom_id' => $room->id,
                    'inspected_by' => $teacher->id,
                    'checked_at' => now()->toDateString(),
                    'cleanliness' => $room->room_code === 'ROOM-204' ? 'needs_attention' : 'good',
                    'chairs' => 'good',
                    'lights' => 'good',
                    'fans' => $room->room_code === 'ROOM-204' ? 'poor' : 'good',
                    'equipment' => $room->room_code === 'LAB-03' ? 'needs_attention' : 'good',
                    'notes' => 'Initial demo inspection',
                    'status' => in_array($room->room_code, ['ROOM-204', 'LAB-03'], true) ? 'needs_attention' : 'ready',
                ]);
            }
        }

        $room = Classroom::where('room_code', 'ROOM-204')->first();
        IssueReport::updateOrCreate(
            ['title' => 'Ceiling fan not working', 'classroom_id' => $room->id],
            ['reported_by' => $teacher->id, 'description' => 'The ceiling fan does not turn on during class.', 'category' => 'electrical', 'priority' => 'high', 'status' => 'reported']
        );
    }
}
