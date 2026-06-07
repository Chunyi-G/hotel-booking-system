<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = [
            ['number' => '101', 'category' => 'standard', 'capacity' => 2, 'price_per_night' => 120.00],
            ['number' => '102', 'category' => 'standard', 'capacity' => 2, 'price_per_night' => 120.00],
            ['number' => '201', 'category' => 'deluxe', 'capacity' => 3, 'price_per_night' => 180.00],
            ['number' => '202', 'category' => 'deluxe', 'capacity' => 3, 'price_per_night' => 180.00],
            ['number' => '301', 'category' => 'suite', 'capacity' => 4, 'price_per_night' => 280.00],
        ];

        foreach ($rooms as $room) {
            Room::updateOrCreate(
                ['number' => $room['number']],
                $room + ['is_active' => true],
            );
        }
    }
}
