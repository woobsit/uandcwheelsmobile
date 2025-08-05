const { faker } = require('@faker-js/faker');

module.exports = {
  createLocation: (overrides = {}) => {
    const nigerianLocation = {
      abia: ["Aba", "Arochukwu", "Umuahia"],
      adamawa: ["Jimeta", "Mubi", "Numan", "Yola"],
      akwaibom: ["Ikot Abasi", "Ikot Ekpene", "Oron", "Uyo"],
      anambra: ["Awka", "Onitsha"],
      imo: ["Owerri"],
      lagos: ["Badagry", "Epe", "Ikeja", "Ikorodu", "Lagos", "Mushin", "Shomolu"]
    };

    const stateKeys = Object.keys(nigerianLocation);

    // Pick a random state if not overridden
    const chosenState = overrides.state?.toLowerCase() || faker.helpers.arrayElement(stateKeys);

    // Pick a random city from that state
    const cities = nigerianLocation[chosenState];
    const chosenCity = overrides.name || faker.helpers.arrayElement(cities);

    return {
      name: chosenCity,
      state: chosenState.charAt(0).toUpperCase() + chosenState.slice(1), // Capitalize
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides, // If override.name or override.state is set, it still applies at the end
    };
  },
};
