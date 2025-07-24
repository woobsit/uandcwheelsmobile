// src/database/factories/passengerFactory.js (Updated)
const faker = require('@faker-js/faker').faker;

module.exports = {
  /**
   * Creates a fake passenger object.
   * @param {Object} overrides - Properties to override the default values.
   */
  createPassenger: (overrides = {}) => {
    const age = faker.number.int({ min: 1, max: 100 });
    
    // Determine passenger type based on age
    let type = 'adult';
    if (age < 18) {
      type = faker.helpers.arrayElement(['lap-child', 'seated-child']);
    }

    // Generate a valid Nigerian phone number
    const nextOfKinPhone = `0${faker.string.numeric({ length: 10, exclude: ['0'] })}`;
    
    // Base passenger data
    const passengerData = {
      booking_id: faker.number.int({ min: 1, max: 1000 }), // Default, but will be overridden
      name: faker.person.fullName(),
      age: age,
      type: type,
      requires_seat: type !== 'lap-child',
      is_on_lap: type === 'lap-child',
      next_of_kin_name: faker.person.fullName(),
      next_of_kin_phone: nextOfKinPhone,
      next_of_kin_relationship: faker.helpers.arrayElement(['parent', 'sibling', 'guardian']),
      seat_number: null, // Let the seeder handle assigning a real seat number
      is_primary: false, // Let the seeder handle this flag
      ...overrides,
    };
    
    return passengerData;
  },
};