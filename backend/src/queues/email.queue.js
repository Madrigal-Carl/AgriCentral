import { Queue } from "bullmq";
import { valkeyConnection } from "../config/valkey.js";

const emailQueue = new Queue("emailQueue", {
  connection: valkeyConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: { age: 24 * 3600 },
  },
});

export default emailQueue;