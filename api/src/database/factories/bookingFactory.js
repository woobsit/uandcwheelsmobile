// src/factories/bookingFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createBooking: (userId, tripId, overrides = {}) => {
    // Determine booking type
    const bookingType =
      overrides.booking_type || faker.helpers.arrayElement(['individual', 'group']);

      const isGuest = userId === null || userId === undefined;
    // Base booking data
    const bookingData = {
      user_id: isGuest ? null : userId,
      trip_id: tripId,
      is_guest: isGuest,
      booking_type: bookingType,
      booking_reference: `BK-${faker.string.alphanumeric(8).toUpperCase()}`,
      payment_status: faker.helpers.arrayElement(['pending', 'paid']),
      payment_method: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'cash']),
      amount_paid: faker.number.float({ min: 1500, max: 15000, precision: 2 }),
      status: 'confirmed',
      ...overrides,
    };

    return bookingData;
  },
};
