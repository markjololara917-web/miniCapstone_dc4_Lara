<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('readiness_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inspected_by')->constrained('users')->cascadeOnDelete();
            $table->date('checked_at');
            $table->string('cleanliness')->default('good');
            $table->string('chairs')->default('good');
            $table->string('lights')->default('good');
            $table->string('fans')->default('good');
            $table->string('equipment')->default('good');
            $table->text('notes')->nullable();
            $table->string('status')->default('ready');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readiness_checks');
    }
};
