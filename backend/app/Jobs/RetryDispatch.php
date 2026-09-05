<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\DispatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RetryDispatch implements ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // ShouldQueueAfterCommit (honoured by the queue dispatcher) holds this job
    // until the surrounding transaction commits: it is dispatched from inside
    // the OrderIntake transaction and must never run before the order row
    // exists, or the retry chain dies and the order strands in "retrying".
    // NB: do not redeclare the Queueable trait's $afterCommit property — a
    // differing default is a fatal class composition error on every boot.

    public function __construct(public Order $order) {}

    public function handle(DispatchService $dispatchService): void
    {
        $result = $dispatchService->retry($this->order);

        if ($result['status'] === 'retrying') {
            $this->release((int) config('dispatch.retry_interval_seconds', 60));
        }
    }
}
