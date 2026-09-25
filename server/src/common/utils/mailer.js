const nodemailer = require("nodemailer");
const env = require("../../config/env");

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
});

async function sendOtpEmail(to, code) {
  await transporter.sendMail({
    from: env.SMTP_USER,
    to,
    subject: "Votre code de connexion PROTECK",
    text: `Votre code de connexion est : ${code} (valide ${env.OTP_EXPIRATION_MINUTES} minutes).`,
  });
}

module.exports = { sendOtpEmail };
