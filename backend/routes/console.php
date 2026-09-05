<?php

use App\Enums\OrderStatus;
use App\Jobs\RetryDispatch;
use App\Models\Order;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Keep the inventory reservation ledger honest — drift here means stock that
// can never be sold. Runs every 15 minutes; dry-run failure (exit code 1)
// surfaces in scheduler monitoring when drift is detected.
Schedule::command('checkstar:reconcile-reservations')->everyFifteenMinutes();

// Safety net for the dispatch retry chain: if a queue worker died mid-chain
// (or the database queue stalled), orders can strand in `retrying` forever.
// Re-enqueue anything that hasn't progressed in 5 minutes; DispatchService
// enforces max_attempts and cancels exhausted orders.
Schedule::call(function () {
    Order::where('status', OrderStatus::Retrying)
        ->where('updated_at', '<', now()->subMinutes(5))
        ->each(fn (Order $order) => RetryDispatch::dispatch($order));
})->everyFiveMinutes()->name('dispatch-retry-sweeper');
