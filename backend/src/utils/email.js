const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error('Email send error:', err);
  }
};

const emailTemplates = {
  welcome: (name) => ({
    subject: `Welcome to EvalSphere, ${name}!`,
    html: `<h2>Welcome, ${name}!</h2><p>Your EvalSphere account has been created.</p>`,
  }),
  evaluationReminder: (name, eventName, link) => ({
    subject: `Reminder: Submit your evaluation for ${eventName}`,
    html: `<h2>Hello ${name},</h2><p>Please submit your evaluation for <b>${eventName}</b>.</p><a href="${link}">Submit Now</a>`,
  }),
  passwordReset: (name, tempPassword) => ({
    subject: 'Your EvalSphere Password Has Been Reset',
    html: `<h2>Hello ${name},</h2><p>Your temporary password is: <b>${tempPassword}</b></p><p>Please change it after login.</p>`,
  }),
};

module.exports = { sendEmail, emailTemplates };
