<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'status' => ['nullable', 'string', 'max:30'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $bookings = Booking::query()
            ->with('room')
            ->when($validated['from'] ?? null, function ($query, string $from): void {
                $query->where('check_out', '>', $from);
            })
            ->when($validated['to'] ?? null, function ($query, string $to): void {
                $query->where('check_in', '<', $to);
            })
            ->when($validated['room_id'] ?? null, function ($query, int $roomId): void {
                $query->where('room_id', $roomId);
            })
            ->when($validated['status'] ?? null, function ($query, string $status): void {
                $query->where('status', $status);
            })
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                });
            })
            ->orderBy('check_in')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_email' => ['required', 'email', 'max:150'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'check_in' => ['required', 'date', 'after_or_equal:today', 'before:check_out'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'guests' => ['required', 'integer', 'min:1', 'max:10'],
        ], [
            'check_in.after_or_equal' => 'Check-in date must be today or later.',
            'check_in.before' => 'Check-in date must be before check-out date.',
            'check_out.after' => 'Check-out date must be after check-in date.',
        ]);

        $booking = DB::transaction(function () use ($validated): Booking {
            $room = Room::query()
                ->where('is_active', true)
                ->findOrFail($validated['room_id']);

            if ($validated['guests'] > $room->capacity) {
                throw ValidationException::withMessages([
                    'guests' => 'Guest count exceeds this room capacity.',
                ]);
            }

            $hasOverlap = Booking::query()
                ->where('room_id', $room->id)
                ->where('status', Booking::STATUS_CONFIRMED)
                ->where('check_in', '<', $validated['check_out'])
                ->where('check_out', '>', $validated['check_in'])
                ->exists();

            if ($hasOverlap) {
                throw ValidationException::withMessages([
                    'room_id' => 'This room is already booked for the selected dates.',
                ]);
            }

            $nights = CarbonImmutable::parse($validated['check_in'])
                ->diffInDays(CarbonImmutable::parse($validated['check_out']));

            return Booking::create([
                ...$validated,
                'total_price' => $nights * (float) $room->price_per_night,
                'status' => Booking::STATUS_CONFIRMED,
            ])->load('room');
        });

        return response()->json(['data' => $booking], 201);
    }
}
