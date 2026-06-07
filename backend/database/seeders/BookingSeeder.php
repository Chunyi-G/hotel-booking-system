<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Room;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        $bookings = [
            [
                'room_number' => '101',
                'customer_name' => 'Aisha Tan',
                'customer_email' => 'aisha@example.com',
                'customer_phone' => '0123456789',
                'check_in' => $today->copy()->subDay()->toDateString(),
                'check_out' => $today->copy()->addDay()->toDateString(),
                'guests' => 2,
            ],
            [
                'room_number' => '201',
                'customer_name' => 'Ben Lim',
                'customer_email' => 'ben@example.com',
                'customer_phone' => '0134567890',
                'check_in' => $today->copy()->addDays(2)->toDateString(),
                'check_out' => $today->copy()->addDays(5)->toDateString(),
                'guests' => 3,
            ],
            [
                'room_number' => '301',
                'customer_name' => 'Chloe Wong',
                'customer_email' => 'chloe@example.com',
                'customer_phone' => '0145678901',
                'check_in' => $today->copy()->subDays(10)->toDateString(),
                'check_out' => $today->copy()->subDays(7)->toDateString(),
                'guests' => 4,
            ],
        ];

        foreach ($bookings as $booking) {
            $room = Room::where('number', $booking['room_number'])->firstOrFail();
            $nights = Carbon::parse($booking['check_in'])->diffInDays(Carbon::parse($booking['check_out']));

            Booking::updateOrCreate(
                [
                    'room_id' => $room->id,
                    'customer_email' => $booking['customer_email'],
                    'check_in' => $booking['check_in'],
                ],
                [
                    'customer_name' => $booking['customer_name'],
                    'customer_phone' => $booking['customer_phone'],
                    'check_out' => $booking['check_out'],
                    'guests' => $booking['guests'],
                    'total_price' => $nights * (float) $room->price_per_night,
                    'status' => Booking::STATUS_CONFIRMED,
                ],
            );
        }
    }
}
