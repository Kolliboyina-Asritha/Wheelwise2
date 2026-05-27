
require('dotenv').config();
const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  console.log('verifyJWT triggered');

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(401); // Unauthorized
  }

  const token = authHeader.split(' ')[1]; // get the token after 'Bearer '
  console.log('Access token:', token);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log('JWT verification error:', err.message);
      return res.sendStatus(403); // Forbidden
    }
        console.log('Decoded JWT:', decoded); 
    req.user = decoded.UserInfo.email;
    req.id=decoded.UserInfo.id;
    req.roles = decoded.UserInfo.roles;
    console.log('Token verified, user:', req.user);
    next();
  });
};

module.exports = verifyJWT;
