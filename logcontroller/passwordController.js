const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../model/userd');
const transporter = require('../utils/mailer');

const CLIENT_URL = process.env.CLIENT_URL;
const JWT_SECRET_RESET = process.env.JWT_SECRET_RESET;

// --- Forgot Password ---
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  console.log('📥 Forgot Password Request Received with email:', email);

  if (!email) {
    console.error('❌ Email field is missing in request body.');
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find User in DB
    console.log('🔎 Looking for user in database...');
    const user = await User.findOne({ email });
    if (!user) {
      console.error('❌ No user found with email:', email);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('✅ User found:', user.firstname, '| Email:', user.email);

    // Check ENV variables
    if (!JWT_SECRET_RESET) {
      console.error('❌ JWT_SECRET_RESET is not defined in environment variables!');
      return res.status(500).json({ message: 'Server Configuration Error' });
    }
    if (!CLIENT_URL) {
      console.error('❌ CLIENT_URL is not defined in environment variables!');
      return res.status(500).json({ message: 'Server Configuration Error' });
    }

    // Generate Reset Token
    console.log('🔑 Generating JWT Reset Token...');
    const token = jwt.sign({ id: user._id }, JWT_SECRET_RESET, { expiresIn: '15m' });
    console.log('✅ Token Generated:', token);

    // Build Reset Link
    const resetLink = `${CLIENT_URL}?token=${token}`;
    console.log('🔗 Reset Link Generated:', resetLink);

    // Send Reset Email
    console.log('📧 Attempting to send reset email to:', email);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${user.firstname},</p>
        <p>You requested to reset your password. Click the link below to continue:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `
    });
    console.log('✅ Reset email sent successfully to:', email);

    res.status(200).json({ message: 'Reset link sent to your email' });

  } catch (err) {
    console.error('🔥 Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Reset Password ---
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  console.log('📥 Reset Password Request Received.');
  console.log('🔐 Token:', token);
  console.log('🔑 New Password Provided.');

  if (!token || !newPassword) {
    console.error('❌ Token or newPassword missing in request.');
    return res.status(400).json({ message: 'Token and password are required' });
  }

  try {
    // Check ENV Secret
    if (!JWT_SECRET_RESET) {
      console.error('❌ JWT_SECRET_RESET is not defined in environment variables!');
      return res.status(500).json({ message: 'Server Configuration Error' });
    }

    // Verify Token
    console.log('🔍 Verifying Reset Token...');
    const decoded = jwt.verify(token, JWT_SECRET_RESET);
    console.log('✅ Token Verified. User ID:', decoded.id);

    // Hash New Password
    console.log('🔐 Hashing New Password...');
    const hashed = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password Hashed.');

    // Update User Password in DB
    console.log('📝 Updating User Password in DB...');
    const updatedUser = await User.findByIdAndUpdate(decoded.id, { password: hashed });

    if (!updatedUser) {
      console.error('❌ User not found while resetting password. User ID:', decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Password Reset Successful for User:', updatedUser.email);
    res.status(200).json({ message: 'Password reset successful' });

  } catch (err) {
    console.error('🔥 Reset Password Error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};
