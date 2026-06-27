import { Queue } from "bullmq";
import { bullRedisConnection } from "../config/redis.js";

const emailQueue = new Queue("emailQueue", {
  connection: bullRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default emailQueue;
