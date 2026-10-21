<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_temporary_admin')->default(false)->after('is_active');
        });
        Schema::table('issue_reports', function (Blueprint $table) {
            $table->foreignId('assigned_to')->nullable()->after('reported_by')->constrained('users')->nullOnDelete();
            $table->text('teacher_response')->nullable()->after('resolution_notes');
            $table->timestamp('assigned_at')->nullable()->after('teacher_response');
        });
    }

    public function down(): void
    {
        Schema::table('issue_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_to');
            $table->dropColumn(['teacher_response', 'assigned_at']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_temporary_admin');
        });
    }
};
