import transporter from "../config/mail.js";

export const sendEmail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  console.log("Email sent:", info.messageId);
};
