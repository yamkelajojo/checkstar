<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\DispatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RetryDispatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
    }

    public function handle(DispatchService $dispatchService): void
    {
        $result = $dispatchService->retry($this->order);

        if ($result['status'] === 'retrying') {
            $this->release((int) config('dispatch.retry_interval_seconds', 60));
        }
    }
}
