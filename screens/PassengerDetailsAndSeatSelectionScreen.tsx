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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import TopNavBar from '../components/molecules/TopNavBar';
import { PassengerDetailsAndSeatSelectionScreenProps } from '../types/screenprops';
import { PassengerPayload } from '../types/passenger';
import { CreateBookingPayload, PaymentMethod } from '../types/booking';
import { BusTrip } from '../types/bustrip';

// Update the import to use the new service function
import BusTripService from '../requests/busTripService';
import { formatCurrency } from '../utils/formatCurrency';

export default function PassengerDetailsAndSeatSelectionScreen() {
  const navigation = useNavigation<PassengerDetailsAndSeatSelectionScreenProps['navigation']>();
  const route = useRoute<PassengerDetailsAndSeatSelectionScreenProps['route']>();

  // Use a state variable for the full BusTrip object, initialized with partial data from route
  const { busTripId: partialBusTrip } = route.params;
 
  // State to hold the full, detailed bus trip object
  const [busTripDetails, setBusTripDetails] = useState<BusTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Fetch bus trip details on component mount ---
  useEffect(() => {
    async function fetchBusTripDetails() {
      try {
        setIsLoading(true);
        // Call the new, detailed API endpoint
        const response = await BusTripService.getBusTripDetails(partialBusTrip);
        const fullTripDetails = response.data;

        if (!fullTripDetails) {
          setError('Bus trip details not found.');
        } else if (
          !fullTripDetails.bus?.capacity ||
          !fullTripDetails.bus?.seat_arrangement ||
          fullTripDetails.bus?.taken_seats === undefined
        ) {
          setError('Incomplete bus configuration received. Please select another trip.');
        } else {
          setBusTripDetails(fullTripDetails);
        }
      } catch (e) {
        setError('Failed to fetch trip details. Please try again.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    if (partialBusTrip) {
      fetchBusTripDetails();
    } else {
      setIsLoading(false);
      setError('No bus trip ID provided.');
    }
  }, [partialBusTrip]);

  // Use a memoized value for the current trip data
  const currentTrip = useMemo(
    () => busTripDetails || partialBusTrip,
    [busTripDetails, partialBusTrip],
  );

  // Passenger Counts
  const [adultCount, setAdultCount] = useState(1);
  const [seatedChildCount, setSeatedChildCount] = useState(0);
  const [lapChildCount, setLapChildCount] = useState(0);

  // Passenger Details state
  const [passengers, setPassengers] = useState<PassengerPayload[]>([]);

  // Seat Selection state
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Guest Booking state
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  // Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Use currentTrip data
  const totalPassengersRequiringSeats = adultCount + seatedChildCount;
  const totalPassengers = totalPassengersRequiringSeats + lapChildCount;
  const totalFare = currentTrip.fare * totalPassengersRequiringSeats;

  // Use the detailed data only if it has been fetched
  const busCapacity = busTripDetails?.bus?.capacity || 0;
  const takenSeats = busTripDetails?.bus?.taken_seats || [];
  const seatArrangement = busTripDetails?.bus?.seat_arrangement;

  // New useEffect to adjust selected seats when count changes
  useEffect(() => {
    const newPassengers: PassengerPayload[] = [];

    // Primary passenger (always one adult)
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

    // Add/remove other adults
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

    const passengersToSet = newPassengers.filter(Boolean);
    const isPassengersChanged =
      passengersToSet.length !== passengers.length ||
      passengersToSet.some(
        (p, index) =>
          p.type !== passengers[index]?.type || p.is_primary !== passengers[index]?.is_primary,
      );

    if (isPassengersChanged) {
      setPassengers(passengersToSet);
    }

    if (selectedSeats.length > totalPassengersRequiringSeats) {
      setSelectedSeats(prev => prev.slice(0, totalPassengersRequiringSeats));
    }
  }, [adultCount, seatedChildCount, lapChildCount, passengers, selectedSeats.length, busCapacity]);

  const handlePassengerChange = useCallback(
    (index: number, field: keyof PassengerPayload, value: any) => {
      setPassengers(prevPassengers => {
        const updatedPassengers = [...prevPassengers];
        if (updatedPassengers[index]) {
          (updatedPassengers[index] as any)[field] = value;
        }
        return updatedPassengers;
      });
    },
    [],
  );

  const toggleSeatSelection = useCallback(
    (seatNumber: string) => {
      if (!busTripDetails) {
        Alert.alert('Loading...', 'Please wait for trip details to load.');
        return;
      }
      if ((busTripDetails?.bus?.taken_seats ?? []).includes(seatNumber)) {
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
    [totalPassengersRequiringSeats, busTripDetails],
  );

  const seatGrid = useMemo(() => {
    const grid: string[][] = [];
    if (!busTripDetails?.bus?.capacity || !busTripDetails?.bus?.seat_arrangement) {
      return grid;
    }

    const [leftCols, rightCols] = busTripDetails.bus.seat_arrangement.split('-').map(Number);
    const totalCols = leftCols + rightCols + 1;

    let seatNum = 1;
    for (
      let row = 0;
      row < Math.ceil(busTripDetails.bus.capacity / (leftCols + rightCols));
      row++
    ) {
      const currentRow: string[] = [];
      for (let col = 1; col <= totalCols; col++) {
        if (col <= leftCols || col > leftCols + 1) {
          if (seatNum <= busTripDetails.bus.capacity) {
            currentRow.push(`S${seatNum}`);
            seatNum++;
          } else {
            currentRow.push('');
          }
        } else {
          currentRow.push('AISLE');
        }
      }
      grid.push(currentRow);
    }
    return grid;
  }, [busTripDetails]);

  const handleProceedToPayment = () => {
    // Validation logic
    if (totalPassengersRequiringSeats === 0 && lapChildCount === 0) {
      Alert.alert('No Passengers', 'Please add at least one passenger.');
      return;
    }

    // Check for empty passenger names
    const emptyNamePassenger = passengers.find(p => !p.name);
    if (emptyNamePassenger) {
      Alert.alert('Missing Details', 'Please enter a name for all passengers.');
      return;
    }

    // Check for zero or invalid age
    const invalidAgePassenger = passengers.find(p => !p.age || p.age <= 0);
    if (invalidAgePassenger) {
      Alert.alert('Invalid Age', 'Please enter a valid age for all passengers.');
      return;
    }

    // Validation for emergency contact
    if (!emergencyContactName || !emergencyContactPhone) {
      Alert.alert('Emergency Contact Required', 'Please provide a name and phone number for the emergency contact.');
      return;
    }

    if (selectedSeats.length !== totalPassengersRequiringSeats) {
      Alert.alert(
        'Seat Selection Required',
        `Please select exactly ${totalPassengersRequiringSeats} seat(s). You have selected ${selectedSeats.length}.`,
      );
      return;
    }

    if (isGuest && (!guestEmail || !/\S+@\S+\.\S+/.test(guestEmail))) {
      Alert.alert('Invalid Guest Email', 'Please enter a valid email for guest booking.');
      return;
    }

    const passengersWithSeats = passengers.map((p, index) => ({
      ...p,
      seat_number: p.requires_seat ? selectedSeats[index] : undefined,
      is_primary: index === 0,
    }));

    const bookingPayload: CreateBookingPayload = {
      outbound_bus_trip_id: currentTrip.id,
      total_amount: totalFare,
      payment_method: PaymentMethod.CASH,
      adult_count: adultCount,
      lap_child_count: lapChildCount,
      seated_child_count: seatedChildCount,
      is_guest: isGuest,
      guest_email: isGuest ? guestEmail : undefined,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      passengers: passengersWithSeats,
    };

    navigation.navigate('Payment', { bookingPayload });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  // Handle errors
  if (error || !busTripDetails) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TopNavBar title="Passenger & Seat Selection" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || 'Failed to load trip details.'}</Text>
          <TouchableOpacity style={styles.proceedButton} onPress={() => navigation.goBack()}>
            <Text style={styles.proceedButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title="Passenger & Seat Selection" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Trip Summary (now uses busTripDetails) */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Trip: {busTripDetails.departure_location} to {busTripDetails.arrival_location}
          </Text>
          <Text style={styles.summaryDetails}>
            Date: {new Date(busTripDetails.departure_time).toLocaleDateString()}
          </Text>
          <Text style={styles.summaryDetails}>
            Bus: {busTripDetails.bus?.plate_number} ({busTripDetails.bus?.brand})
          </Text>
          <Text style={styles.summaryDetails}>
            Fare per seat: {formatCurrency(busTripDetails.fare)}
          </Text>
          <Text style={styles.summaryTotal}>Total Fare: {formatCurrency(totalFare)}</Text>
        </View>

        {/* ... (The rest of your JSX remains largely the same, but now references `busTripDetails` for `takenSeats`, `seatArrangement`, `busCapacity`, etc.) ... */}
        <Text style={styles.sectionTitle}>Number of Passengers</Text>
        <View style={styles.passengerCountContainer}>
          <Text style={styles.passengerCountLabel}>Adults (18+)</Text>
          <View style={styles.countStepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setAdultCount(Math.max(1, adultCount - 1))}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{adultCount}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setAdultCount(adultCount + 1)}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.passengerCountContainer}>
          <Text style={styles.passengerCountLabel}>Seated Children (2-17)</Text>
          <View style={styles.countStepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setSeatedChildCount(Math.max(0, seatedChildCount - 1))}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{seatedChildCount}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setSeatedChildCount(seatedChildCount + 1)}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.passengerCountContainer}>
          <Text style={styles.passengerCountLabel}>Lap Children (0-2)</Text>
          <View style={styles.countStepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setLapChildCount(Math.max(0, lapChildCount - 1))}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{lapChildCount}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setLapChildCount(lapChildCount + 1)}
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
                onChangeText={text => handlePassengerChange(index, 'name', text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Age"
                value={passenger.age ? String(passenger.age) : ''}
                onChangeText={text => handlePassengerChange(index, 'age', Number(text))}
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
                onChangeText={text => handlePassengerChange(index, 'next_of_kin_name', text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Next of Kin Phone"
                value={passenger.next_of_kin_phone}
                onChangeText={text => handlePassengerChange(index, 'next_of_kin_phone', text)}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Mother, Brother"
                value={passenger.next_of_kin_relationship}
                onChangeText={text =>
                  handlePassengerChange(index, 'next_of_kin_relationship', text)
                }
              />
            </View>
          </View>
        ))}
        {/* Emergency Contact outside passenger loop as a general requirement */}
        {!isGuest && (
          <>
            <Text style={styles.sectionTitle}>Emergency Contact (Required)</Text>
            <View style={styles.passengerCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Emergency contact name"
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Emergency contact phone number"
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </>
        )}

        {/* Seat Selection */}
        <Text style={styles.sectionTitle}>
          Select Your Seats ({selectedSeats.length} of {totalPassengersRequiringSeats} selected)
        </Text>
        {totalPassengersRequiringSeats === 0 && (
          <Text style={styles.infoText}> No seats needed for current passenger selection.</Text>
        )}
        {totalPassengersRequiringSeats > 0 && (
          <View style={styles.seatMapContainer}>
            {seatGrid.length === 0 ? (
              <Text style={styles.errorText}>No seat arrangement found for this bus.</Text>
            ) : (
              seatGrid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.seatRow}>
                  {row.map((seatNumber, colIndex) => {
                    const isAisle = seatNumber === 'AISLE';
                    // Use the fetched data
                    const isTaken =
                      (busTripDetails.bus.taken_seats ?? []).includes(seatNumber) &&
                      !selectedSeats.includes(seatNumber);
                    const isSelected = selectedSeats.includes(seatNumber);

                    return (
                      <TouchableOpacity
                        key={`${rowIndex}-${colIndex}`}
                        style={[
                          styles.seat,
                          isAisle && styles.aisleSeat,
                          isTaken && styles.seatTaken,
                          isSelected && styles.seatSelected,
                          (!seatNumber || isAisle || isTaken) && styles.seatDisabled,
                        ]}
                        onPress={() => !isAisle && !isTaken && toggleSeatSelection(seatNumber)}
                        disabled={isAisle || isTaken}
                      >
                        <Text style={[styles.seatText, isAisle && styles.aisleText]}>
                          {isAisle ? '' : seatNumber.replace('S', '')}
                        </Text>
                        {isTaken && !isAisle && !isSelected && (
                          <MaterialIcons
                            name="event-seat"
                            size={24}
                            color="#6c757d"
                            style={styles.seatIcon}
                          />
                        )}
                        {isSelected && (
                          <MaterialIcons
                            name="check-circle"
                            size={20}
                            color="#fff"
                            style={styles.seatIcon}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        )}

        {/* Total Summary at Bottom */}
        <View style={styles.bottomSummaryCard}>
          <Text style={styles.bottomSummaryText}>Total Seats Selected: {selectedSeats.length}</Text>
          <Text style={styles.bottomSummaryText}>Total Passengers: {totalPassengers}</Text>
          <Text style={styles.bottomSummaryTotal}>Amount Due: {formatCurrency(totalFare)}</Text>
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToPayment}>
            <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Your styles are fine and do not need to be changed.
// ... (The styles remain the same) ...

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
