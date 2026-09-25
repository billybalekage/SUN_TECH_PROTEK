const nodemailer = require("nodemailer");
const { env } = require("../../config/env");

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  ...(env.smtp.user && env.smtp.pass
    ? { auth: { user: env.smtp.user, pass: env.smtp.pass } }
    : {}),
});

async function sendOtpEmail(to, code) {
  await transporter.sendMail({
    from: {
      name: env.smtp.fromName,
      address: env.smtp.fromEmail,
    },
    to,
    subject: "Votre code de connexion PROTECK",
    text: `Votre code de connexion est : ${code} (valide ${env.OTP_EXPIRATION_MINUTES} minutes).`,
  });
}

module.exports = { sendOtpEmail };
