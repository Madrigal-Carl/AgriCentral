import { Worker } from "bullmq";
import { valkeyConnection } from "../../config/valkey.js";
import { sendEmail } from "../../services/email.service.js";
import { EMAIL_JOBS } from "../email.jobs.js";
import { accountApprovedTemplate } from "../../templates/email/account-approved.template.js";
import { requestApprovedTemplate } from "../../templates/email/request-approved.template.js";
import { requestReleasedTemplate } from "../../templates/email/request-released.template.js";
import { requestRejectedTemplate } from "../../templates/email/request-rejected.template.js";
import { reportApprovedTemplate } from "../../templates/email/report-approved.template.js";
import { reportRejectedTemplate } from "../../templates/email/report-rejected.template.js";

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { type, data } = job.data;

    const handlers = {
      [EMAIL_JOBS.ACCOUNT_APPROVED]: async () => {
        return sendEmail({
          to: data.to,
          subject: "Your Account Has Been Approved",
          html: accountApprovedTemplate({ name: data.name }),
        });
      },

      [EMAIL_JOBS.REQUEST_APPROVED]: async () => {
        return sendEmail({
          to: data.to,
          subject: `Your Request "${data.requestTitle}" Has Been Approved`,
          html: requestApprovedTemplate({
            name: data.name,
            requestTitle: data.requestTitle,
            entityType: data.entityType,
            items: data.items,
          }),
        });
      },

      [EMAIL_JOBS.REQUEST_RELEASED]: async () => {
        return sendEmail({
          to: data.to,
          subject: data.isPartial
            ? `Items Partially Released for "${data.requestTitle}"`
            : `Items Released for "${data.requestTitle}"`,
          html: requestReleasedTemplate({
            name: data.name,
            requestTitle: data.requestTitle,
            entityType: data.entityType,
            items: data.items,
            isPartial: data.isPartial,
          }),
        });
      },

      [EMAIL_JOBS.REQUEST_REJECTED]: async () => {
        return sendEmail({
          to: data.to,
          subject: `Your Request "${data.requestTitle}" Has Been Denied`,
          html: requestRejectedTemplate({
            name: data.name,
            requestTitle: data.requestTitle,
            stage: data.stage,
            remarks: data.remarks,
          }),
        });
      },

      [EMAIL_JOBS.REPORT_APPROVED]: async () => {
        return sendEmail({
          to: data.to,
          subject: `Your Report "${data.reportTitle}" Has Been Approved`,
          html: reportApprovedTemplate({
            name: data.name,
            reportTitle: data.reportTitle,
            entityType: data.entityType,
            stage: data.stage,
            items: data.items,
          }),
        });
      },

      [EMAIL_JOBS.REPORT_REJECTED]: async () => {
        return sendEmail({
          to: data.to,
          subject: `Your Report "${data.reportTitle}" Has Been Denied`,
          html: reportRejectedTemplate({
            name: data.name,
            reportTitle: data.reportTitle,
            stage: data.stage,
            remarks: data.remarks,
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
    connection: valkeyConnection,
  },
);

emailWorker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job failed: ${job?.id}`, err);
});

export default emailWorker;