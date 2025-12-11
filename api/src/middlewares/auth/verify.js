// utils/verify.js
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const generateToken = (payload, type = 'access') => {
  const secret = type === 'access' ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;
  const expiresIn = type === 'access' ? '15m' : '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, type = 'access') => {
  const secret = type === 'access' ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };
