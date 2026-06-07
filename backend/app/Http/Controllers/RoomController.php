<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        $rooms = Room::query()
            ->where('is_active', true)
            ->when($validated['category'] ?? null, function ($query, string $category): void {
                $query->where('category', $category);
            })
            ->orderBy('category')
            ->orderBy('number')
            ->get();

        return response()->json(['data' => $rooms]);
    }
}
