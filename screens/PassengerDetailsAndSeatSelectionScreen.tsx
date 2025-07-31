// screens/PassengerDetailsAndSeatSelectionScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import TopNavBar from '../components/molecules/TopNavBar'; // Your existing component
import { PassengerDetailsAndSeatSelectionScreenProps } from '../types/screenprops';
import { PassengerPayload } from '../types/passenger';
import { CreateBookingPayload, PaymentMethod } from '../types/booking';
// import BusTripService from '../requests/busTripService'; //
// Helper to format currency (you might have your own in utils)

const formatCurrency = (amount: number) => `₦${amount?.toLocaleString()}`;

export default function PassengerDetailsAndSeatSelectionScreen() {
  const navigation = useNavigation<PassengerDetailsAndSeatSelectionScreenProps['navigation']>();
  const route = useRoute<PassengerDetailsAndSeatSelectionScreenProps['route']>();

  const { selectedBusTrip } = route.params; // The full BusTrip object passed from TripDetailsScreen
  // Removed isLoading, as the trip details are already passed via route.params
  // const [isLoading, setIsLoading] = useState(true); // <--- REMOVED
  const [error, setError] = useState<string | null>(null); // Keep error state for potential future validations/issues

  // Passenger Counts
  const [adultCount, setAdultCount] = useState(1);
  const [seatedChildCount, setSeatedChildCount] = useState(0);
  const [lapChildCount, setLapChildCount] = useState(0);

  // Passenger Details state (dynamic array of forms)
  const [passengers, setPassengers] = useState<PassengerPayload[]>([]);

  // Seat Selection state
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Guest Booking state
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  // Emergency Contact (can be primary passenger's or separate)
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Derived values
  const totalPassengersRequiringSeats = adultCount + seatedChildCount;
  const totalPassengers = totalPassengersRequiringSeats + lapChildCount;
  const totalFare = selectedBusTrip.fare * totalPassengersRequiringSeats; // Assuming lap children don't pay fare

  // Use optional chaining for bus properties to prevent errors if 'bus' is undefined
  const busCapacity = selectedBusTrip.bus?.capacity || 0;
  const takenSeats = selectedBusTrip.bus?.taken_seats || [];
  const seatArrangement = selectedBusTrip.bus?.seat_arrangement;

  /*  // Initialize/Update passenger forms based on counts
  useEffect(() => {
    const newPassengers: PassengerPayload[] = [];

    // Primary passenger (always one adult)
    // Find existing primary passenger to retain their details if counts change
    const existingPrimary = passengers.find(p => p.is_primary);
    newPassengers.push(
      existingPrimary && existingPrimary.type === 'adult'
        ? existingPrimary
        : {
            name: '',
            age: 0,
            type: 'adult',
            requires_seat: true,
            is_on_lap: false,
            next_of_kin_name: '',
            next_of_kin_phone: '',
            next_of_kin_relationship: '',
            is_primary: true,
          },
    );

    // Add/remove other adults (starting from index 1 as primary is index 0)
    for (let i = 0; i < adultCount - 1; i++) {
      newPassengers.push(
        passengers[i + 1] && passengers[i + 1].type === 'adult' && !passengers[i + 1].is_primary
          ? passengers[i + 1]
          : {
              name: '',
              age: 0,
              type: 'adult',
              requires_seat: true,
              is_on_lap: false,
              next_of_kin_name: '',
              next_of_kin_phone: '',
              next_of_kin_relationship: '',
              is_primary: false,
            },
      );
    }

    // Add/remove seated children
    for (let i = 0; i < seatedChildCount; i++) {
      const currentPassengerIndex = adultCount + i;
      newPassengers.push(
        passengers[currentPassengerIndex] &&
          passengers[currentPassengerIndex].type === 'seated-child'
          ? passengers[currentPassengerIndex]
          : {
              name: '',
              age: 0,
              type: 'seated-child',
              requires_seat: true,
              is_on_lap: false,
              next_of_kin_name: '',
              next_of_kin_phone: '',
              next_of_kin_relationship: '',
              is_primary: false,
            },
      );
    }

    // Add/remove lap children
    for (let i = 0; i < lapChildCount; i++) {
      const currentPassengerIndex = adultCount + seatedChildCount + i;
      newPassengers.push(
        passengers[currentPassengerIndex] && passengers[currentPassengerIndex].type === 'lap-child'
          ? passengers[currentPassengerIndex]
          : {
              name: '',
              age: 0,
              type: 'lap-child',
              requires_seat: false,
              is_on_lap: true,
              next_of_kin_name: '',
              next_of_kin_phone: '',
              next_of_kin_relationship: '',
              is_primary: false,
            },
      );
    }

    setPassengers(newPassengers.filter(Boolean)); // Ensure no null/undefined entries

    // Adjust selected seats if count changes
    if (selectedSeats.length > totalPassengersRequiringSeats) {
      setSelectedSeats(prev => prev.slice(0, totalPassengersRequiringSeats));
    }
    // Removed the 'else if' block that caused the 'prevSeats' error
    // else if (selectedSeats.length < totalPassengersRequiringSeats && prevSeats.length < busCapacity) {
    //   // You might want to pre-select seats if there are available and not enough are selected
    //   // This is a more advanced feature, leaving it out for now.
    // }
  }, [adultCount, seatedChildCount, lapChildCount, passengers, selectedSeats.length, busCapacity]);

  // Handle passenger input changes
  const handlePassengerChange = useCallback(
    (index: number, field: keyof PassengerPayload, value: any) => {
      setPassengers(prevPassengers => {
        const updatedPassengers = [...prevPassengers];
        // Ensure the passenger object exists at the index
        if (updatedPassengers[index]) {
          (updatedPassengers[index] as any)[field] = value;
        }
        return updatedPassengers;
      });
    },
    [],
  );

  // Seat selection logic
  const toggleSeatSelection = useCallback(
    (seatNumber: string) => {
      if (takenSeats.includes(seatNumber)) {
        Alert.alert('Seat Taken', `Seat ${seatNumber} is already taken.`);
        return;
      }
      setSelectedSeats(prevSeats => {
        if (prevSeats.includes(seatNumber)) {
          return prevSeats.filter(seat => seat !== seatNumber);
        } else {
          if (prevSeats.length < totalPassengersRequiringSeats) {
            return [...prevSeats, seatNumber];
          } else {
            Alert.alert(
              'Too Many Seats',
              `You can only select ${totalPassengersRequiringSeats} seat(s) for your trip.`,
            );
            return prevSeats;
          }
        }
      });
    },
    [totalPassengersRequiringSeats, takenSeats],
  );

  // Generate seat grid for display
  const seatGrid = useMemo(() => {
    const grid: string[][] = [];
    if (!busCapacity || !seatArrangement) {
      setError('Bus capacity or seat arrangement details are missing.'); // Set error if critical data is missing
      return grid;
    }

    const [leftCols, rightCols] = seatArrangement.split('-').map(Number);
    const totalCols = leftCols + rightCols + 1; // +1 for aisle

    let seatNum = 1;
    for (let row = 0; row < Math.ceil(busCapacity / (leftCols + rightCols)); row++) {
      const currentRow: string[] = [];
      for (let col = 1; col <= totalCols; col++) {
        if (col <= leftCols || col > leftCols + 1) {
          // Not an aisle
          if (seatNum <= busCapacity) {
            currentRow.push(`S${seatNum}`); // Example: S1, S2, etc. Adjust if seat numbers are A1, B1 etc.
            seatNum++;
          } else {
            currentRow.push(''); // Empty placeholder for remaining spaces if capacity reached
          }
        } else {
          currentRow.push('AISLE'); // Placeholder for aisle
        }
      }
      grid.push(currentRow);
    }
    return grid;
  }, [busCapacity, seatArrangement]);*/

  // Handle form submission and navigate to payment
  const handleProceedToPayment = () => {
    // 1. Validate passenger counts
    if (totalPassengersRequiringSeats === 0 && lapChildCount === 0) {
      Alert.alert('No Passengers', 'Please add at least one passenger.');
      return;
    }

    // 2. Validate passenger details
    for (const p of passengers) {
      if (
        !p.name ||
        !p.age ||
        p.age <= 0 ||
        !p.next_of_kin_name ||
        !p.next_of_kin_phone ||
        !p.next_of_kin_relationship
      ) {
        Alert.alert(
          'Missing Passenger Details',
          'Please fill in all required fields for all passengers.',
        );
        return;
      }
      if (p.type === 'lap-child' && p.age >= 5) {
        // Example rule: lap child max age
        Alert.alert('Invalid Age', 'Lap children must be under 5 years old.');
        return;
      }
      // Basic phone number validation
      if (!/^\+?[0-9]{10,15}$/.test(p.next_of_kin_phone)) {
        Alert.alert('Invalid Phone', 'Please enter a valid next of kin phone number.');
        return;
      }
    }

    // 3. Validate seat selection
    if (selectedSeats.length !== totalPassengersRequiringSeats) {
      Alert.alert(
        'Seat Selection Required',
        `Please select exactly ${totalPassengersRequiringSeats} seat(s). You have selected ${selectedSeats.length}.`,
      );
      return;
    }

    // 4. Validate guest email if applicable
    if (isGuest && (!guestEmail || !/\S+@\S+\.\S+/.test(guestEmail))) {
      Alert.alert('Invalid Guest Email', 'Please enter a valid email for guest booking.');
      return;
    }

    // Assign selected seats to passengers who require them
    // This simple assignment assumes the order of passengers in the array corresponds to the order seats are selected
    // For more robust UX, you might have a way to link a specific passenger to a specific seat.
    const passengersWithSeats = passengers.map((p, index) => ({
      ...p,
      seat_number: p.requires_seat ? selectedSeats[index] : undefined,
      is_primary: index === 0, // Assuming first passenger is primary
    }));

    const bookingPayload: CreateBookingPayload = {
      outbound_bus_trip_id: selectedBusTrip.id,
      total_amount: totalFare,
      payment_method: PaymentMethod.CASH, // Placeholder, will be chosen on PaymentScreen
      adult_count: adultCount,
      lap_child_count: lapChildCount,
      seated_child_count: seatedChildCount,
      is_guest: isGuest,
      guest_email: isGuest ? guestEmail : undefined,
      emergency_contact_name: emergencyContactName, // Can also derive from primary passenger
      emergency_contact_phone: emergencyContactPhone, // Can also derive from primary passenger
      passengers: passengersWithSeats,
    };

    navigation.navigate('Payment', { bookingPayload });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title="Passenger & Seat Selection" />

      {/* Replaced isLoading check with direct error check, as details are passed */}
      {error ? ( // <--- MODIFIED
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Trip Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Trip: {selectedBusTrip.departure_location} to {selectedBusTrip.arrival_location}
            </Text>
            <Text style={styles.summaryDetails}>
              Date: {new Date(selectedBusTrip.departure_time).toLocaleDateString()}
            </Text>
            <Text style={styles.summaryDetails}>
              Bus: {selectedBusTrip.bus?.plate_number} ({selectedBusTrip.bus?.brand})
            </Text>
            <Text style={styles.summaryDetails}>
              Fare per seat: {formatCurrency(selectedBusTrip.fare)}
            </Text>
            <Text style={styles.summaryTotal}>Total Fare: {formatCurrency(totalFare)}</Text>
          </View>

          {/* Passenger Count Selector */}
          <Text style={styles.sectionTitle}>Number of Passengers</Text>
          <View style={styles.passengerCountContainer}>
            <Text style={styles.passengerCountLabel}>Adults:</Text>
            <View style={styles.countStepper}>
              <TouchableOpacity
                onPress={() => setAdultCount(Math.max(1, adultCount - 1))}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{adultCount}</Text>
              <TouchableOpacity
                onPress={() => setAdultCount(adultCount + 1)}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.passengerCountContainer}>
            <Text style={styles.passengerCountLabel}>Seated Children:</Text>
            <View style={styles.countStepper}>
              <TouchableOpacity
                onPress={() => setSeatedChildCount(Math.max(0, seatedChildCount - 1))}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{seatedChildCount}</Text>
              <TouchableOpacity
                onPress={() => setSeatedChildCount(seatedChildCount + 1)}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.passengerCountContainer}>
            <Text style={styles.passengerCountLabel}>Lap Children:</Text>
            <View style={styles.countStepper}>
              <TouchableOpacity
                onPress={() => setLapChildCount(Math.max(0, lapChildCount - 1))}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{lapChildCount}</Text>
              <TouchableOpacity
                onPress={() => setLapChildCount(lapChildCount + 1)}
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guest Booking Toggle */}
          <View style={styles.guestToggleContainer}>
            <Text style={styles.sectionTitle}>Booking as Guest?</Text>
            <Switch value={isGuest} onValueChange={setIsGuest} />
          </View>
          {isGuest && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Guest Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter guest email"
                value={guestEmail}
                onChangeText={setGuestEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Passenger Details Forms */}
          <Text style={styles.sectionTitle}>Passenger Details ({totalPassengers} total)</Text>
          {passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerCard}>
              <Text style={styles.passengerCardTitle}>
                {index === 0 ? 'Primary Passenger' : `Passenger ${index + 1}`} ({passenger.type})
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full Name"
                  value={passenger.name}
                  //   onChangeText={text => handlePassengerChange(index, 'name', text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Age"
                  value={passenger.age ? String(passenger.age) : ''}
                  //   onChangeText={text => handlePassengerChange(index, 'age', Number(text))}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.passengerCardSubtitle}>Next of Kin Details:</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Next of Kin Name"
                  value={passenger.next_of_kin_name}
                  //   onChangeText={text => handlePassengerChange(index, 'next_of_kin_name', text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Next of Kin Phone"
                  value={passenger.next_of_kin_phone}
                  //   onChangeText={text => handlePassengerChange(index, 'next_of_kin_phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Mother, Brother"
                  value={passenger.next_of_kin_relationship}
                  //   onChangeText={text =>
                  //     handlePassengerChange(index, 'next_of_kin_relationship', text)}
                />
              </View>
            </View>
          ))}

          {/* Seat Selection */}
          <Text style={styles.sectionTitle}>
            Select Your Seats ({selectedSeats.length} of {totalPassengersRequiringSeats} selected)
          </Text>
          {totalPassengersRequiringSeats === 0 && (
            <Text style={styles.infoText}>No seats needed for current passenger selection.</Text>
          )}
          {/* {totalPassengersRequiringSeats > 0 && (
            // <View style={styles.seatMapContainer}>
            //   {seatGrid.length === 0 ? (
            //     <Text style={styles.errorText}>No seat arrangement found for this bus.</Text>
            //   ) : (
            //     seatGrid.map((row, rowIndex) => (
            //       <View key={rowIndex} style={styles.seatRow}>
            //         {row.map((seatNumber, colIndex) => {
            //           const isAisle = seatNumber === 'AISLE';
            //           const isTaken =
            //             takenSeats.includes(seatNumber) && !selectedSeats.includes(seatNumber);
            //           const isSelected = selectedSeats.includes(seatNumber);

            //           return (
            //             <TouchableOpacity
            //               key={`${rowIndex}-${colIndex}`}
            //               style={[
            //                 styles.seat,
            //                 isAisle && styles.aisleSeat,
            //                 isTaken && styles.seatTaken,
            //                 isSelected && styles.seatSelected,
            //                 (!seatNumber || isAisle || isTaken) && styles.seatDisabled, // Disable empty, aisle, or taken seats
            //               ]}
            //               onPress={() => !isAisle && !isTaken && toggleSeatSelection(seatNumber)}
            //               disabled={isAisle || isTaken} // Explicitly disable buttons
            //             >
            //               <Text style={[styles.seatText, isAisle && styles.aisleText]}>
            //                 {isAisle ? '' : seatNumber.replace('S', '')}
            //               </Text>
            //               {isTaken && !isAisle && !isSelected && (
            //                 <MaterialIcons
            //                   name="event-seat"
            //                   size={24}
            //                   color="#6c757d" // Grey for taken seats
            //                   style={styles.seatIcon}
            //                 />
            //               )}
            //               {isSelected && (
            //                 <MaterialIcons
            //                   name="check-circle"
            //                   size={20}
            //                   color="#fff"
            //                   style={styles.seatIcon}
            //                 />
            //               )}
            //             </TouchableOpacity>
            //           );
            //         })}
            //       </View>
            //     ))
            //   )}
            // </View>
          )} */}

          {/* Total Summary at Bottom */}
          <View style={styles.bottomSummaryCard}>
            <Text style={styles.bottomSummaryText}>
              Total Seats Selected: {selectedSeats.length}
            </Text>
            <Text style={styles.bottomSummaryText}>Total Passengers: {totalPassengers}</Text>
            <Text style={styles.bottomSummaryTotal}>Amount Due: {formatCurrency(totalFare)}</Text>
            <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToPayment}>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  errorText: { fontSize: 16, color: '#ff6b6b', textAlign: 'center', marginTop: 10 },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  summaryDetails: { fontSize: 15, color: '#555', marginBottom: 3 },
  summaryTotal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 15 },
  passengerCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  passengerCountLabel: { fontSize: 16, color: '#555' },
  countStepper: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  stepperValue: { fontSize: 16, marginHorizontal: 15, fontWeight: 'bold', color: '#333' },
  guestToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 14, color: '#555', marginBottom: 5, fontWeight: '500' },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passengerCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  passengerCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  passengerCardSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
    marginTop: 10,
  },
  seatMapContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    alignItems: 'center', // Center the seat grid
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5, // Spacing between rows
  },
  seat: {
    width: 40,
    height: 40,
    borderRadius: 5,
    margin: 3, // Spacing between seats
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Default available seat color
    position: 'relative',
  },
  aisleSeat: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    width: 20, // Narrower for aisle
  },
  seatTaken: {
    backgroundColor: '#ffadad', // Red for taken seats
  },
  seatSelected: {
    backgroundColor: '#007AFF', // Blue for selected seats
  },
  seatDisabled: {
    opacity: 0.6, // Dim disabled seats
  },
  seatText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  aisleText: {
    color: '#888',
    fontSize: 10,
    position: 'absolute', // To prevent text from affecting seat layout
    bottom: -5,
  },
  seatIcon: {
    position: 'absolute',
    opacity: 0.7, // Slightly transparent
  },
  infoText: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  bottomSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  bottomSummaryText: { fontSize: 16, color: '#555', marginBottom: 5 },
  bottomSummaryTotal: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginTop: 10 },
  proceedButton: {
    backgroundColor: '#28a745', // Green for proceed
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  proceedButtonText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
});
