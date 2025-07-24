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
    const passengerCount = faker.number.int({ min: 1, max: 4 });
    const adultCount = faker.number.int({ min: 1, max: passengerCount });
    const seatedChildCount = faker.number.int({ min: 0, max: passengerCount - adultCount });
    const lapChildCount = passengerCount - adultCount - seatedChildCount;

    // Base booking data
    const bookingData = {
      // Required IDs
      user_id: isGuest ? null : userId,
      outbound_bus_trip_id: outboundBusTripId,
      return_bus_trip_id: returnBusTripId,

      // Auto-generated fields in the model, so we don't need to generate them here
      // booking_reference: handled by model hook
      // booking_date: handled by model defaultValue

      // Required fields
      total_amount: faker.number.float({ min: 1500 * passengerCount, max: 15000 * passengerCount, precision: 2 }),
      amount_paid: faker.number.float({ min: 1500 * passengerCount, max: 15000 * passengerCount, precision: 2 }),
      status: faker.helpers.arrayElement(['confirmed', 'cancelled']),
      
      // Passenger counts
      adult_count: adultCount,
      lap_child_count: lapChildCount,
      seated_child_count: seatedChildCount,
      
      // Guest-related
      is_guest: isGuest,
      guest_email: isGuest ? faker.internet.email() : null,

      // Other fields
      payment_status: faker.helpers.arrayElement(['paid', 'pending', 'failed']),
      payment_method: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'cash', null]),
      notes: faker.lorem.sentence(),
      emergency_contact_name: faker.person.fullName(),
      emergency_contact_phone: `0${faker.string.numeric({ length: 10 })}`,

      ...overrides,
    };

    // Ensure amount_paid doesn't exceed total_amount and is set to 0 if payment is pending/failed
    if (bookingData.payment_status === 'pending' || bookingData.payment_status === 'failed') {
      bookingData.amount_paid = 0;
    } else if (bookingData.amount_paid > bookingData.total_amount) {
        bookingData.amount_paid = bookingData.total_amount;
    }

    return bookingData;
  },
};