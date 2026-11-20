import { escapeHtml } from "../../utils/escapeHtml.js";

export const passwordResetOtpTemplate = ({ name, otp, expiresInMinutes = 10 }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Code</title>
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
                background:#16a34a;
                padding:32px;
                text-align:center;
                color:#ffffff;
              "
            >
              <h1 style="margin:0;font-size:26px;">Password Reset Code</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;">
              <p style="font-size:16px;color:#111827;margin-top:0;">
                Hi ${escapeHtml(name || "there")},
              </p>

              <p style="font-size:16px;line-height:1.7;color:#4b5563;">
                We received a request to reset the password for your
                AgriCentral account. Enter the code below to continue.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <span
                  style="
                    display:inline-block;
                    background:#dcfce7;
                    color:#166534;
                    padding:16px 28px;
                    border-radius:12px;
                    font-size:32px;
                    font-weight:700;
                    letter-spacing:0.35em;
                    font-family:'Courier New',Courier,monospace;
                  "
                >
                  ${escapeHtml(otp)}
                </span>
              </div>

              <p style="font-size:14px;line-height:1.7;color:#6b7280;text-align:center;margin-top:0;">
                This code expires in <strong>${escapeHtml(expiresInMinutes)} minutes</strong>.
              </p>

              <p style="font-size:14px;line-height:1.7;color:#6b7280;">
                Never share this code with anyone. If you did not request a
                password reset, you can safely ignore this email; your
                password will not change.
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
