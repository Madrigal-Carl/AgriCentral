import "./config/env.js";
import "./config/valkey.js";
import "./config/cloudinary.js";
import "./queues/workers/email.worker.js";

import app from "./app.js";
import connectDB from "./config/db.js";
import { autoDenyStaleRequests } from "./services/request.service.js";
import { startRequestAutoDenyScheduler } from "./schedulers/requestAutoDeny.scheduler.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => startRequestAutoDenyScheduler(autoDenyStaleRequests, {
    intervalMs: Number(process.env.AUTO_DENY_INTERVAL_MINUTES ?? 1) * 60_000,
  }))
  .catch((error) => console.error("Request auto-deny scheduler failed to start:", error));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
