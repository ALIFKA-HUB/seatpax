# Passenger loading investigation — 22 October 2026

## Evidence

The screenshot shows the streamed hero while JourneyPlanner awaits availability.locations(). Dev-server logs included application render times of 38s and 22.8 minutes. Before changes a browser received the hero in 533ms but the search form was still pending after 20.5s. The data set contained 4 trips / 16 trip stops. A separate fresh TLS-verified process connected in 636ms; the exact locations query took 37ms. Later both the dev process and separate processes returned CONNECT_TIMEOUT at approximately 5s. Thus the evidence indicates intermittent database connectivity and unbounded shared-pool queue/read waiting, not evidence that circle animation caused the loading delay. Underlying network interruption has not been eliminated by application code.

## Change

app/trips/data.ts now uses a dedicated reusable max:1 connection pool for public availability reads, separate from hold/payment writes. Each operation has an 8s wall-clock deadline covering queue and work. On deadline the cached read pool is discarded and ended with timeout:0; the next read obtains a fresh pool. Existing UI unavailable/retry handling remains. Queries, tenant/sale eligibility, seat/payment transaction code, schema and TLS verification are unchanged. No stale availability cache is added. Concurrent operations in a stalled read pool may fail together when it is recycled. This boundary does not time-limit auth middleware or every possible page dependency.

An initial per-operation-client experiment still encountered CONNECT_TIMEOUT and would add connection churn; it was replaced with the reusable read pool. Temporary timing/config-match diagnostics were removed without recording credentials or query data.

## Verification

- TypeScript: exit 0 on final reusable-pool implementation.
- Browser, actual localhost: last two homepage loads reached search controls at 5105ms and 1371ms, with sourceUnavailable=false. First-byte times 648ms and 182ms. These are local development observations, not production benchmarks or an assurance of network health.
- Earlier /trips page rendered in 5292ms during the per-operation experiment; no final real booking/payment acceptance claimed.
- Independent GPT-6 Luna medium source review: no important findings. Confirmed timeout resets only read pool, leaving writes separate.
- No new tests or full suite/build run. Network-fault deadline semantics reviewed in source; no production outage was induced.
