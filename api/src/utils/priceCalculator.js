// utils/priceCalculator.js
const calculatePassengerFare = (age, baseFare) => {
  if (age < 6) return 0; // Infant (lap child)
  if (age < 12) return baseFare * 0.5; // Child discount
  return baseFare; // Adult fare
};

const calculateTotalFare = (passengers, baseFare) => {
  return passengers.reduce((total, passenger) => {
    return total + calculatePassengerFare(passenger.age, baseFare);
  }, 0);
};
