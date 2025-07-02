const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const generateToken = (payload, tokenExpiration) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: tokenExpiration });
};

const verifyToken = token => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
