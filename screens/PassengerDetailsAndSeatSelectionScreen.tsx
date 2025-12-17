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
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import TopNavBar from '../components/molecules/TopNavBar';
import { PassengerDetailsAndSeatSelectionScreenProps } from '../types/screenprops';
import { PassengerPayload } from '../types/passenger';
import { CreateBookingPayload, PaymentMethod } from '../types/booking';
import { BusTrip } from '../types/bustrip';

import BusTripService from '../requests/busTripService';
import { formatCurrency } from '../utils/formatCurrency';

export default function PassengerDetailsAndSeatSelectionScreen() {
  const navigation = useNavigation<PassengerDetailsAndSeatSelectionScreenProps['navigation']>();
  const route = useRoute<PassengerDetailsAndSeatSelectionScreenProps['route']>();

  const { busTripId: partialBusTrip } = route.params;
  const [busTripDetails, setBusTripDetails] = useState<BusTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusTripDetails() {
      try {
        setIsLoading(true);
        const response = await BusTripService.getBusTripDetails(partialBusTrip);
        const fullTripDetails = response.data;
        if (
          !fullTripDetails ||
          !fullTripDetails.bus?.capacity ||
          !fullTripDetails.bus?.seat_arrangement ||
          !Array.isArray(fullTripDetails.bus?.taken_seats)
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

  const currentTrip = useMemo(() => busTripDetails, [busTripDetails]);

  const [adultCount, setAdultCount] = useState(1);
  const [seatedChildCount, setSeatedChildCount] = useState(0);
  const [lapChildCount, setLapChildCount] = useState(0);
  const [passengers, setPassengers] = useState<PassengerPayload[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const totalPassengersRequiringSeats = adultCount + seatedChildCount;
  const totalPassengers = totalPassengersRequiringSeats + lapChildCount;
  const totalFare = currentTrip ? currentTrip.fare * totalPassengersRequiringSeats : 0;

  const busCapacity = busTripDetails?.bus?.capacity || 0;
  const takenSeats = busTripDetails?.bus?.taken_seats || [];
  const seatArrangement = busTripDetails?.bus?.seat_arrangement;

  useEffect(() => {
    const newPassengers: PassengerPayload[] = [];

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
    [totalPassengersRequiringSeats, busTripDetails, takenSeats],
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
    if (!currentTrip) {
      Alert.alert('Error', 'Trip details are not available. Please try again.');
      return;
    }

    if (totalPassengersRequiringSeats === 0 && lapChildCount === 0) {
      Alert.alert('No Passengers', 'Please add at least one passenger.');
      return;
    }

    const emptyNamePassenger = passengers.find(p => !p.name);
    if (emptyNamePassenger) {
      Alert.alert('Missing Details', 'Please enter a name for all passengers.');
      return;
    }

    const invalidAgePassenger = passengers.find(p => !p.age || p.age <= 0);
    if (invalidAgePassenger) {
      Alert.alert('Invalid Age', 'Please enter a valid age for all passengers.');
      return;
    }

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
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  if (error || !busTripDetails) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <TopNavBar title="Passenger & Seat Selection" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#FF4444" />
          <Text style={styles.errorText}>{error || 'Failed to load trip details.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title="Passenger & Seat Selection" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Trip Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          <Text style={styles.cardInfo}>
            <Text style={styles.cardInfoLabel}>Route:</Text>{' '}
            {busTripDetails.departure_location} to {busTripDetails.arrival_location}
          </Text>
          <Text style={styles.cardInfo}>
            <Text style={styles.cardInfoLabel}>Date:</Text>{' '}
            {new Date(busTripDetails.departure_time).toLocaleDateString()}
          </Text>
          <Text style={styles.cardInfo}>
            <Text style={styles.cardInfoLabel}>Bus:</Text>{' '}
            {busTripDetails.bus?.plate_number} ({busTripDetails.bus?.brand})
          </Text>
          <Text style={styles.cardInfo}>
            <Text style={styles.cardInfoLabel}>Fare per seat:</Text>{' '}
            {formatCurrency(busTripDetails.fare)}
          </Text>
        </View>

        {/* Passenger Count */}
        <Text style={styles.sectionTitle}>Number of Passengers</Text>
        <View style={styles.card}>
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
        </View>

        {/* Guest Booking Toggle */}
        <Text style={styles.sectionTitle}>Booking Options</Text>
        <View style={[styles.card, styles.guestToggleContainer]}>
          <Text style={styles.cardTitle}>Book as Guest?</Text>
          <Switch
            value={isGuest}
            onValueChange={setIsGuest}
            trackColor={{ false: '#767577', true: '#FFC107' }}
            thumbColor={isGuest ? '#FFC107' : '#f4f3f4'}
          />
        </View>
        {isGuest && (
          <View style={styles.card}>
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
          </View>
        )}

        {/* Passenger Details Forms */}
        <Text style={styles.sectionTitle}>Passenger Details ({totalPassengers} total)</Text>
        {passengers.map((passenger, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>
              {index === 0 ? 'Primary Passenger' : `Passenger ${index + 1}`}
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
          </View>
        ))}

        {/* Emergency Contact */}
        <Text style={styles.sectionTitle}>Emergency Contact (Required)</Text>
        <View style={styles.card}>
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

        {/* Seat Selection */}
        <Text style={styles.sectionTitle}>
          Select Your Seats ({selectedSeats.length} of {totalPassengersRequiringSeats} selected)
        </Text>
        <View style={styles.card}>
          {totalPassengersRequiringSeats === 0 ? (
            <Text style={styles.infoText}>No seats needed for current passenger selection.</Text>
          ) : seatGrid.length === 0 ? (
            <Text style={styles.errorText}>No seat arrangement found for this bus.</Text>
          ) : (
            <>
              <View style={styles.seatLegendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.seatLegend, styles.seatAvailable]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.seatLegend, styles.seatTaken]} />
                  <Text style={styles.legendText}>Taken</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.seatLegend, styles.seatSelected]} />
                  <Text style={styles.legendText}>Selected</Text>
                </View>
              </View>
              <View style={styles.seatMapContainer}>
                {seatGrid.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.seatRow}>
                    {row.map((seatNumber, colIndex) => {
                      const isAisle = seatNumber === 'AISLE';
                      const isTaken = takenSeats.includes(seatNumber);
                      const isSelected = selectedSeats.includes(seatNumber);

                      return (
                        <TouchableOpacity
                          key={`${rowIndex}-${colIndex}`}
                          style={[
                            styles.seat,
                            isAisle && styles.aisleSeat,
                            isTaken && styles.seatTaken,
                            isSelected && styles.seatSelected,
                          ]}
                          onPress={() => !isAisle && !isTaken && toggleSeatSelection(seatNumber)}
                          disabled={isAisle || isTaken}
                        >
                          <Text style={[styles.seatText, isAisle && styles.aisleText]}>
                            {isAisle ? '' : seatNumber.replace('S', '')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Total Summary and Proceed Button */}
        <View style={styles.bottomSummaryCard}>
          <Text style={styles.bottomSummaryText}>
            Total Seats Selected: <Text style={styles.boldText}>{selectedSeats.length}</Text>
          </Text>
          <Text style={styles.bottomSummaryText}>
            Total Passengers: <Text style={styles.boldText}>{totalPassengers}</Text>
          </Text>
          <Text style={styles.bottomSummaryTotal}>
            Amount Due: <Text style={styles.boldText}>{formatCurrency(totalFare)}</Text>
          </Text>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceedToPayment}
            disabled={selectedSeats.length !== totalPassengersRequiringSeats}
          >
            <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A2540' },
  container: { paddingHorizontal: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A2540' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#fff' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
    backgroundColor: '#0A2540',
  },
  errorText: { fontSize: 16, color: '#FF4444', textAlign: 'center', marginTop: 10 },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardInfo: { fontSize: 15, color: '#444', marginBottom: 5 },
  cardInfoLabel: { fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 15 },
  passengerCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  passengerCountLabel: { fontSize: 16, color: '#555' },
  countStepper: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: {
    backgroundColor: '#0A2540',
    borderRadius: 8,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  stepperValue: { fontSize: 18, marginHorizontal: 15, fontWeight: 'bold', color: '#0A2540' },
  guestToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 14, color: '#555', marginBottom: 5, fontWeight: 'bold' },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#0A2540',
  },
  seatMapContainer: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  seatLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatLegend: {
    width: 20,
    height: 20,
    borderRadius: 5,
    marginRight: 8,
  },
  seatAvailable: { backgroundColor: '#e0e0e0' },
  legendText: { fontSize: 14, color: '#555' },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
 seat: {
    width: 45,
    height: 45,
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  aisleSeat: {
    backgroundColor: 'transparent',
    width: 20,
    margin: 4,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  seatTaken: { 
    backgroundColor: '#FF4444' 
  },
  seatSelected: { 
    backgroundColor: '#007AFF' 
  },
  seatText: { 
    color: '#0A2540', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  aisleText: { 
    color: '#888', 
    fontSize: 10 
  },
  infoText: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  bottomSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomSummaryText: { fontSize: 16, color: '#444', marginBottom: 5 },
  bottomSummaryTotal: { fontSize: 18, fontWeight: 'bold', color: '#0A2540', marginTop: 10 },
  boldText: { fontWeight: 'bold', color: '#0A2540' },
  proceedButton: {
    backgroundColor: '#FFC107',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  proceedButtonText: { color: '#0A2540', fontWeight: 'bold', fontSize: 17 },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});