import { Worker } from "bullmq";
import redis from "../../config/redis.js";
import { sendEmail } from "../../services/email.service.js";
import { EMAIL_JOBS } from "../email.jobs.js";

import { accountApprovedTemplate } from "../../templates/email/account-approved.template.js";

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { type, data } = job.data;

    const handlers = {
      [EMAIL_JOBS.ACCOUNT_APPROVED]: async () => {
        return sendEmail({
          to: data.to,
          subject: "Your Account Has Been Approved",
          html: accountApprovedTemplate({
            name: data.name,
          }),
        });
      },
    };

    const handler = handlers[type];

    if (!handler) {
      throw new Error(`Unknown email job type: ${type}`);
    }

    return handler();
  },
  {
    connection: redis,
  },
);

emailWorker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job failed: ${job?.id}`, err);
});

export default emailWorker;
