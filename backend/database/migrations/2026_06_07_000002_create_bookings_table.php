<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->date('check_in')->index();
            $table->date('check_out')->index();
            $table->unsignedTinyInteger('guests')->default(1);
            $table->decimal('total_price', 10, 2);
            $table->string('status')->default('confirmed')->index();
            $table->timestamps();

            $table->index(['room_id', 'check_in', 'check_out']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
