const { OAuth2Client } = require('google-auth-library');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../../model/userd');
const ROLES_LIST = require('../../config/role_list'); // if using a roles list
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/auth/google', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Split name into first and last name
    const [firstname, ...rest] = name.split(" ");
    const lastname = rest.join(" ");

    let user = await User.findOne({ email }).exec();

    if (!user) {
      user = await User.create({
        firstname,
        lastname,
        email,
        isGoogleUser: true,
        profilePic: picture,
        roles: { User: 2001 }
      });
    }

    const roles = Object.values(user.roles);

    // Generate access token
    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: user._id.toString(),
          email: user.email,
          roles
        }
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '10m' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
    );

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'Lax' // for localhost testing
      // secure: true, // use this in production with HTTPS
    });

    const redirectTo =
      user.roles?.Seller === ROLES_LIST?.Seller ? '/seller/dashboard' : '/';

    res.json({ accessToken, redirectTo });

  } catch (err) {
    console.error('Google token verification failed:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

module.exports = router;
