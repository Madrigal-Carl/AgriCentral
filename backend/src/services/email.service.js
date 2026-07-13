import brevo from "../config/mail.js";

export const sendEmail = async ({ to, subject, html, text }) => {
  const result = await brevo.transactionalEmails.sendTransacEmail({
    sender: { email: process.env.EMAIL_FROM, name: "AgriCentral" },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  });

  console.log("Email sent:", result);
};