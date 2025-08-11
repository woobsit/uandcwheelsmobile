// src/database/factories/passengerFactory.js (Updated)
const faker = require('@faker-js/faker').faker;

module.exports = {
  /**
   * Creates a fake passenger object based on a given type and booking ID.
   * @param {Object} overrides - Properties to override the default values.
   */
  createPassenger: (overrides = {}) => {
    // Generate a valid Nigerian phone number
    const nextOfKinPhone = `${faker.helpers.arrayElement(['080', '090'])}${faker.string.numeric({ length: 8, exclude: ['0'] })}`;

    const { type, is_primary, booking_id, ...otherOverrides } = overrides;
    
    // Determine age and seat requirements based on the provided type
    let age;
    let requires_seat;
    let is_on_lap;

    if (type === 'adult') {
      age = faker.number.int({ min: 18, max: 80 });
      requires_seat = true;
      is_on_lap = false;
    } else if (type === 'seated-child') {
      age = faker.number.int({ min: 2, max: 17 });
      requires_seat = true;
      is_on_lap = false;
    } else if (type === 'lap-child') {
      age = faker.number.int({ min: 1, max: 2 });
      requires_seat = false;
      is_on_lap = true;
    } else {
      // Default to adult if no type is provided
      age = faker.number.int({ min: 18, max: 80 });
      requires_seat = true;
      is_on_lap = false;
    }

    // Base passenger data
    const passengerData = {
      booking_id: booking_id,
      name: faker.person.fullName(),
      age: age,
      type: type,
      requires_seat: requires_seat,
      is_on_lap: is_on_lap,
      next_of_kin_name: faker.person.fullName(),
      next_of_kin_phone: nextOfKinPhone,
      next_of_kin_relationship: faker.helpers.arrayElement(['parent', 'sibling', 'guardian']),
      seat_number: requires_seat ? null : 0, // Set seat to null for lap children
      is_primary: is_primary || false, // The seeder will set this flag
      ...otherOverrides,
    };

    return passengerData;
  },
};