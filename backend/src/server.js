import "./config/env.js";
import "./config/valkey.js";
import "./config/cloudinary.js";
import "./queues/workers/email.worker.js";

import app from "./app.js";
import connectDB from "./config/db.js";
import { autoDenyStaleRequests } from "./services/request.service.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => autoDenyStaleRequests())
  .then((summary) => console.log("Startup request auto-deny sweep:", summary))
  .catch((error) => console.error("Startup request auto-deny sweep failed:", error));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
