// The sweep keeps the seven-day inactivity rule and request-level database locks.
// Injecting it lets scheduling be tested without connecting to external services.
export function startRequestAutoDenyScheduler(sweep, { intervalMs = 60_000, logger = console } = {}) {
    if (!Number.isSafeInteger(intervalMs) || intervalMs <= 0 || intervalMs > 2_147_483_647) {
        throw new Error("AUTO_DENY_INTERVAL_MINUTES must produce a positive interval of at most 2147483647 ms");
    }

    let running = false;
    let stopped = false;
    const run = async () => {
        if (running || stopped) return;
        running = true;
        try {
            const summary = await sweep();
            logger.log("Scheduled request auto-deny sweep:", summary);
        } catch (error) {
            logger.error("Scheduled request auto-deny sweep failed:", error);
        } finally {
            running = false;
        }
    };

    const timer = setInterval(() => { void run(); }, intervalMs);
    timer.unref();
    void run();

    return () => {
        stopped = true;
        clearInterval(timer);
    };
}
