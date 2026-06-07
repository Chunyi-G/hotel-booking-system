<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomAvailabilityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'check_in' => ['required', 'date', 'after_or_equal:today', 'before:check_out'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'category' => ['nullable', 'string', 'max:50'],
        ], [
            'check_in.after_or_equal' => 'Check-in date must be today or later.',
            'check_in.before' => 'Check-in date must be before check-out date.',
            'check_out.after' => 'Check-out date must be after check-in date.',
        ]);

        $rooms = Room::query()
            ->where('is_active', true)
            ->when($validated['category'] ?? null, function ($query, string $category): void {
                $query->where('category', $category);
            })
            ->whereDoesntHave('bookings', function ($query) use ($validated): void {
                $query->where('status', Booking::STATUS_CONFIRMED)
                    ->where('check_in', '<', $validated['check_out'])
                    ->where('check_out', '>', $validated['check_in']);
            })
            ->orderBy('number')
            ->get();

        return response()->json(['data' => $rooms]);
    }
}
