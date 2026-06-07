<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\JsonResponse;

class RoomHistoryController extends Controller
{
    public function show(Room $room): JsonResponse
    {
        $room->load([
            'bookings' => fn ($query) => $query
                ->orderByDesc('check_in')
                ->orderByDesc('id'),
        ]);

        return response()->json(['data' => $room]);
    }
}
