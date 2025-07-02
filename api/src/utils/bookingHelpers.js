// utils/bookingHelpers.js
const crypto = require('crypto');

function generateBookingRef() {
  return `BK-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

function validateSeatNumber(seat) {
  const regex = /^[A-Z]\d{1,2}$/;
  return regex.test(seat);
}

module.exports = {
  generateBookingRef,
  validateSeatNumber,
};
