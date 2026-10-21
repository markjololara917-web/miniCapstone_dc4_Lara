<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('admin_id')->nullable()->after('role')->constrained('users')->nullOnDelete();
            $table->string('invite_code', 24)->nullable()->unique()->after('admin_id');
            $table->boolean('is_active')->default(true)->after('invite_code');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('admin_id');
            $table->dropUnique(['invite_code']);
            $table->dropColumn(['invite_code', 'is_active']);
        });
    }
};
