// src/factories/bookingFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createBooking: (userId, tripId, overrides = {}) => ({
    user_id: userId,
    trip_id: tripId,
    seat_number: `${faker.string.alpha(1).toUpperCase()}${faker.number.int({ min: 1, max: 20 })}`,
    booking_reference: `BK-${faker.string.alphanumeric(8).toUpperCase()}`,
    payment_status: faker.helpers.arrayElement(['pending', 'paid']),
    payment_method: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'cash']),
    amount_paid: faker.number.float({ min: 1500, max: 15000, precision: 2 }),
    status: 'confirmed',
    ...overrides,
  }),
};
