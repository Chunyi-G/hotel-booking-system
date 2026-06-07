<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class StaffDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        return response()->json([
            'data' => [
                'total_rooms' => Room::where('is_active', true)->count(),
                'active_bookings' => Booking::where('status', Booking::STATUS_CONFIRMED)
                    ->where('check_in', '<=', $today)
                    ->where('check_out', '>', $today)
                    ->count(),
                'upcoming_check_ins' => Booking::with('room')
                    ->where('status', Booking::STATUS_CONFIRMED)
                    ->where('check_in', '>=', $today)
                    ->orderBy('check_in')
                    ->limit(5)
                    ->get(),
                'upcoming_check_outs' => Booking::with('room')
                    ->where('status', Booking::STATUS_CONFIRMED)
                    ->where('check_out', '>=', $today)
                    ->orderBy('check_out')
                    ->limit(5)
                    ->get(),
                'recent_bookings' => Booking::with('room')
                    ->latest()
                    ->limit(10)
                    ->get(),
            ],
        ]);
    }
}
