import nodemailer from "nodemailer";
import { logger } from "../core/logger";

export function createMailTransport() {
  const host = process.env.SMTP_HOST || "localhost";
  const port = Number(process.env.SMTP_PORT || 1025);
  const from = process.env.SMTP_FROM || "noreply@tg-moderator.local";

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: false,
  });

  return { transport, from };
}

export async function sendAuthEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const { transport, from } = createMailTransport();
  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function queueAuthEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  void sendAuthEmail(options).catch((error) => {
    logger.error({ error: error as Error, to: options.to }, "Auth email failed");
  });
}
