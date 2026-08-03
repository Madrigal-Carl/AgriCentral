export const reportRejectedTemplate = ({
  name,
  reportTitle,
  stage,
  remarks,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Report Denied</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          style="
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,0.08);
          "
        >
          <tr>
            <td
              style="
                background:#dc2626;
                padding:32px;
                text-align:center;
                color:#ffffff;
              "
            >
              <h1 style="margin:0;font-size:26px;">Report Denied</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;">
              <p style="font-size:16px;color:#111827;margin-top:0;">
                Dear ${name || "there"},
              </p>

              <p style="font-size:16px;line-height:1.7;color:#4b5563;">
                We regret to inform you that your report titled
                <strong>"${reportTitle}"</strong> has been reviewed and
                denied by the <strong>${stage}</strong>.
              </p>

              <div style="margin:24px 0;padding:16px 20px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.03em;">
                  Reason provided
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">
                  ${remarks || "No specific remarks were provided."}
                </p>
              </div>

              <p style="font-size:14px;line-height:1.7;color:#6b7280;">
                If you believe this decision was made in error, or would
                like clarification, please contact your reviewing officer
                or submit a revised report addressing the concerns above.
              </p>

              <p style="font-size:16px;color:#111827;margin-bottom:0;">
                Thank you,<br />
                <strong>Your Team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td
              style="
                background:#f9fafb;
                padding:20px;
                text-align:center;
                color:#9ca3af;
                font-size:12px;
              "
            >
              This is an automated email. Please do not reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
