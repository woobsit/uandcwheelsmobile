// src/database/factories/bookingFactory.js (Updated)
const faker = require('@faker-js/faker').faker;

module.exports = {
  /**
   * Creates a fake booking object.
   * @param {number|null} userId - The ID of the user, or null if guest.
   * @param {number} outboundBusTripId - The ID of the outbound bus trip.
   * @param {number|null} returnBusTripId - The ID of the return bus trip, or null.
   * @param {Object} overrides - Properties to override the default values.
   */
  createBooking: (userId, outboundBusTripId, returnBusTripId = null, overrides = {}) => {
    const isGuest = userId === null || userId === undefined;
    const { total_amount, adult_count, seated_child_count, lap_child_count, ...otherOverrides } = overrides;

    const passengerCount = adult_count + seated_child_count; // Lap children don't occupy a seat

    // Base booking data
    const bookingData = {
      user_id: isGuest ? null : userId,
      outbound_bus_trip_id: outboundBusTripId,
      return_bus_trip_id: returnBusTripId,

      // These values are now expected to be passed via overrides
      total_amount: total_amount,
      amount_paid: total_amount, // Assume all bookings are paid for seeding
      status: faker.helpers.arrayElement(['confirmed', 'cancelled']),

      // Passenger counts from overrides
      adult_count: adult_count || 0,
      lap_child_count: lap_child_count || 0,
      seated_child_count: seated_child_count || 0,

      is_guest: isGuest,
      guest_email: isGuest ? faker.internet.email() : null,

      payment_status: 'paid', // Assume 'paid' for confirmed bookings
      payment_method: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'cash', null]),
      notes: faker.lorem.sentence(),
      emergency_contact_name: faker.person.fullName(),
      emergency_contact_phone: `0${faker.string.numeric({ length: 10 })}`,

      ...otherOverrides,
    };

    // Ensure amount_paid is set to 0 if payment is pending/failed
    if (bookingData.payment_status === 'pending' || bookingData.payment_status === 'failed') {
      bookingData.amount_paid = 0;
    }
    
    return bookingData;
  },
};