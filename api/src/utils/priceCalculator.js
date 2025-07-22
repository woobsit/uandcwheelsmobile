// utils/priceCalculator.js - Updated with correct pricing logic
const calculateGroupFare = (adults, children, baseFare) => {
  // Unaccompanied children pricing
  if (adults === 0) {
    const pairs = Math.floor(children / 2);
    const singles = children % 2;
    return (pairs * 0.5 * baseFare) + (singles * baseFare);
  }
  
  // Accompanied children pricing
  const lapChildren = Math.min(adults, children);
  const seatedChildren = children - lapChildren;
  
  return (adults * baseFare) + 
         (lapChildren * 0.5 * baseFare) + 
         (seatedChildren * baseFare);
};

const calculateRoundTripFare = (adults, children, outboundFare, returnFare) => {
  const outbound = calculateGroupFare(adults, children, outboundFare);
  const ret = calculateGroupFare(adults, children, returnFare);
  return outbound + ret;
};

module.exports = { calculateGroupFare, calculateRoundTripFare };