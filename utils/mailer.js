const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: 'Test Email',
  html: '<p>This is a test email</p>',
}, (err, info) => {
  if (err) {
    console.error('❌ Email failed:', err);
  } else {
    console.log('✅ Email sent:', info.response);
  }
});
