export const requestReleasedTemplate = ({
  name,
  requestTitle,
  entityType,
  items = [],
  isPartial,
}) => {
  const itemsRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">
            ${item.label}
          </td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">
            ${item.propertyNumber}
          </td>
        </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Items Released</title>
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
                background:#2563eb;
                padding:32px;
                text-align:center;
                color:#ffffff;
              "
            >
              <h1 style="margin:0;font-size:26px;">
                ${isPartial ? "Items Partially Released" : "Items Released"}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;">
              <p style="font-size:16px;color:#111827;margin-top:0;">
                Dear ${name || "there"},
              </p>

              <p style="font-size:16px;line-height:1.7;color:#4b5563;">
                This is to inform you that the ${entityType} item(s) under
                your request <strong>"${requestTitle}"</strong>
                ${
                  isPartial
                    ? "have been partially released and added to your association."
                    : "have been fully released and added to your association."
                }
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#374151;">Item</td>
                  <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#374151;">Property No.</td>
                </tr>
                ${
                  itemsRows ||
                  `
                <tr>
                  <td colspan="2" style="padding:16px;font-size:14px;color:#9ca3af;text-align:center;">
                    No item details available.
                  </td>
                </tr>`
                }
              </table>

              <div style="text-align:center;margin:32px 0;">
                <span
                  style="
                    display:inline-block;
                    background:#dbeafe;
                    color:#1e40af;
                    padding:12px 20px;
                    border-radius:999px;
                    font-weight:600;
                  "
                >
                  ${isPartial ? "◐ Partially Released" : "✓ Fully Released"}
                </span>
              </div>

              ${
                isPartial
                  ? `<p style="font-size:14px;line-height:1.7;color:#6b7280;">
                    Some of the originally requested items were no longer
                    available at the time of release and could not be
                    included.
                  </p>`
                  : ""
              }

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
};
