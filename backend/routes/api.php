<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\RoomAvailabilityController;
use App\Http\Controllers\RoomHistoryController;
use App\Http\Controllers\StaffDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/available', [RoomAvailabilityController::class, 'index']);
Route::get('/rooms/{room}/history', [RoomHistoryController::class, 'show']);

Route::get('/bookings', [BookingController::class, 'index']);
Route::post('/bookings', [BookingController::class, 'store']);

Route::get('/staff/dashboard', StaffDashboardController::class);
