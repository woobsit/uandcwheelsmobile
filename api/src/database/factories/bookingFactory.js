// src/factories/bookingFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createBooking: (userId, tripId, overrides = {}) => {
    // Determine booking type
    const bookingType = overrides.booking_type || faker.helpers.arrayElement(['individual', 'group']);
    
    // Generate appropriate seats data based on booking type
    let seats;
    if (bookingType === 'individual') {
      // Generate 1-4 random seat numbers
      const seatCount = faker.number.int({ min: 1, max: 4 });
      seats = Array.from({ length: seatCount }, () => 
        `${faker.string.alpha(1).toUpperCase()}${faker.number.int({ min: 1, max: 20 })}`
      );
    } else {
      // Generate group booking quantity
      seats = faker.number.int({ min: 1, max: 10 });
    }

    // Base booking data
    const bookingData = {
      user_id: userId,
      trip_id: tripId,
      booking_type: bookingType,
      seats: seats,
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