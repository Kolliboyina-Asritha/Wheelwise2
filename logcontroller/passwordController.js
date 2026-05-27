const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../model/userd');
const transporter = require('../utils/mailer');

const CLIENT_URL = process.env.CLIENT_URL;
const JWT_SECRET_RESET = process.env.JWT_SECRET_RESET;

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET_RESET, { expiresIn: '15m' });
    const resetLink = `${CLIENT_URL}?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Hello ${user.firstname},</p>
             <p>You requested to reset your password. Click the link below to continue:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>This link will expire in 15 minutes.</p>`
    });

    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_RESET);

    const hashed = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(decoded.id, { password: hashed });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};
