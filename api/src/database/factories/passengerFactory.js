// src/factories/passengerFactory.js
const faker = require('@faker-js/faker').faker;

module.exports = {
  createPassenger: (overrides = {}) => {
    // Determine if primary (override or random)
    const isPrimary = overrides.is_primary ?? faker.datatype.boolean({ probability: 0.3 });
    
    // Generate Nigerian phone number that matches validation regex
    const nigerianPhone = '0' + 
      faker.string.numeric({ length: 10, exclude: ['0'] }) // Ensure no leading zero after first
        .replace(/(\d{3})(\d{3})(\d{4})/, '$1$2$3'); // Format as 08123456789
    
    // Generate valid seat number (A1-Z99 format)
    const row = faker.string.alpha({ length: 1, casing: 'upper', exclude: ['I', 'O'] }); // Skip I/O for clarity
    const seatNum = faker.number.int({ min: 1, max: 99 });
    
    // Base passenger data
    const passengerData = {
      name: faker.person.fullName(),
      email: isPrimary ? faker.internet.email() : null,
      phone: isPrimary ? nigerianPhone : null,
      age: isPrimary 
        ? faker.number.int({ min: 18, max: 65 })  // Primary passengers are adults
        : faker.number.int({ min: 1, max: 100 }), // Companions can be any age
      gender: faker.helpers.arrayElement(['male', 'female']),
      seat_number: `${row}${seatNum}`,
      is_primary: isPrimary,
      user_id: isPrimary ? faker.string.uuid() : null,
      booking_id: faker.string.uuid(), // Will typically be overridden
      ...overrides,
    };
    
    // Ensure phone matches regex if provided
    if (passengerData.phone && !/^(0)[0-9]{10}$/.test(passengerData.phone)) {
      passengerData.phone = nigerianPhone;
    }
    
    return passengerData;
  },
  
  createPrimaryPassenger: (bookingId, userId, overrides = {}) => {
    return this.createPassenger({
      booking_id: bookingId,
      user_id: userId,
      is_primary: true,
      ...overrides
    });
  },
  
  createCompanionPassenger: (bookingId, overrides = {}) => {
    return this.createPassenger({
      booking_id: bookingId,
      is_primary: false,
      user_id: null,
      ...overrides
    });
  },
  
  createPassengerForBooking: (bookingId, isPrimary = false, userId = null) => {
    return this.createPassenger({
      booking_id: bookingId,
      is_primary: isPrimary,
      user_id: isPrimary ? userId : null
    });
  }
};