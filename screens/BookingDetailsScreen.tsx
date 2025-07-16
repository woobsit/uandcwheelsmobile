// BookingDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatDate } from '../utils/dateHelpers';
import { Trip } from '../types/trip';
import { BookingService } from '../requests';
import TopNavBar from '../components/molecules/TopNavBar';
import { AuthStackParamList, BookingDetailsScreenRouteProp } from '../types/screenprops';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define booking state
interface BookingDetails {
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  numberOfSeats: number;
}

export default function BookingDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<BookingDetailsScreenRouteProp>();
  const trip = route.params?.trip as Trip;

  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    passengerName: '',
    passengerEmail: '',
    passengerPhone: '',
    numberOfSeats: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [isSeatFetching, setIsSeatFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available seats for this trip
  const fetchAvailableSeats = async () => {
    try {
      setIsSeatFetching(true);
      // In a real app, you would call your backend API to get actual available seats
      // For now, we'll use the bus capacity minus a random number
      const available = trip.Bus?.capacity ? trip.Bus.capacity - Math.floor(Math.random() * 10) : 0;
      setAvailableSeats(Math.max(available, 0));

      // Set max seats to available seats
      if (bookingDetails.numberOfSeats > available) {
        setBookingDetails(prev => ({
          ...prev,
          numberOfSeats: Math.min(prev.numberOfSeats, available),
        }));
      }
    } catch (error) {
      console.error('Error fetching available seats:', error);
      Alert.alert('Error', 'Could not fetch available seats for this trip');
    } finally {
      setIsSeatFetching(false);
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!bookingDetails.passengerName.trim()) {
      newErrors.passengerName = 'Please enter your name';
    }

    if (!bookingDetails.passengerEmail.trim()) {
      newErrors.passengerEmail = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(bookingDetails.passengerEmail)) {
      newErrors.passengerEmail = 'Please enter a valid email';
    }

    if (!bookingDetails.passengerPhone.trim()) {
      newErrors.passengerPhone = 'Please enter your phone number';
    } else if (bookingDetails.passengerPhone.replace(/\D/g, '').length < 10) {
      newErrors.passengerPhone = 'Please enter a valid phone number';
    }

    if (bookingDetails.numberOfSeats < 1) {
      newErrors.numberOfSeats = 'Please select at least 1 seat';
    } else if (bookingDetails.numberOfSeats > availableSeats) {
      newErrors.numberOfSeats = `Only ${availableSeats} seats available`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle booking submission
  const handleBookNow = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Create booking payload
      //   const bookingData = {
      //     tripId: trip.id,
      //     passengerName: bookingDetails.passengerName,
      //     passengerEmail: bookingDetails.passengerEmail,
      //     passengerPhone: bookingDetails.passengerPhone,
      //     numberOfSeats: bookingDetails.numberOfSeats,
      //     totalAmount: trip.fare * bookingDetails.numberOfSeats,
      //   };

      // Submit booking to backend
      //   const response = await BookingService.createBooking(bookingData);

      // Navigate to confirmation screen
      //   navigation.navigate('BookingConfirmation', {
      //     booking: response.data,
      //     trip: trip,
      //     bookingDetails: bookingDetails,
      //   });
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        'Booking Failed',
        'There was an error processing your booking. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchAvailableSeats();
  }, []);

  // Calculate total price
  const totalPrice = trip.fare * bookingDetails.numberOfSeats;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* <TopNavBar title="Booking Details" onBack={() => navigation.goBack()} /> */}

      <ScrollView contentContainerStyle={styles.container}>
        {/* Trip Details Card */}
        <View style={styles.tripCard}>
          <Text style={styles.tripRoute}>
            {trip.departure_location} → {trip.arrival_location}
          </Text>

          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={20} color="#555" />
            <Text style={styles.detailText}>
              {formatDate(trip.departure_time, 'EEE, MMM d')} •{' '}
              {formatDate(trip.departure_time, 'hh:mm a')} -{' '}
              {formatDate(trip.estimated_arrival, 'hh:mm a')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="directions-bus" size={20} color="#555" />
            <Text style={styles.detailText}>
              {trip.Bus?.brand || 'Standard Bus'} • {trip.Bus?.plate_number || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={20} color="#555" />
            <Text style={styles.detailText}>Driver: {trip.Driver?.name || 'Not specified'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Fare per seat:</Text>
            <Text style={styles.priceValue}>₦{trip.fare.toLocaleString()}</Text>
          </View>
        </View>

        {/* Passenger Information */}
        <Text style={styles.sectionTitle}>Passenger Information</Text>

        <View style={styles.formCard}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.passengerName && styles.inputError]}
              placeholder="Enter your full name"
              value={bookingDetails.passengerName}
              onChangeText={text => setBookingDetails({ ...bookingDetails, passengerName: text })}
            />
            {errors.passengerName && <Text style={styles.errorText}>{errors.passengerName}</Text>}
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.passengerEmail && styles.inputError]}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={bookingDetails.passengerEmail}
              onChangeText={text => setBookingDetails({ ...bookingDetails, passengerEmail: text })}
            />
            {errors.passengerEmail && <Text style={styles.errorText}>{errors.passengerEmail}</Text>}
          </View>

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.passengerPhone && styles.inputError]}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={bookingDetails.passengerPhone}
              onChangeText={text => setBookingDetails({ ...bookingDetails, passengerPhone: text })}
            />
            {errors.passengerPhone && <Text style={styles.errorText}>{errors.passengerPhone}</Text>}
          </View>
        </View>

        {/* Seat Selection */}
        <Text style={styles.sectionTitle}>Seat Selection</Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Seats</Text>

            {isSeatFetching ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <View style={styles.seatSelector}>
                  <TouchableOpacity
                    style={styles.seatButton}
                    onPress={() =>
                      setBookingDetails({
                        ...bookingDetails,
                        numberOfSeats: Math.max(1, bookingDetails.numberOfSeats - 1),
                      })
                    }
                    disabled={bookingDetails.numberOfSeats <= 1}
                  >
                    <MaterialIcons
                      name="remove"
                      size={24}
                      color={bookingDetails.numberOfSeats <= 1 ? '#ccc' : '#007AFF'}
                    />
                  </TouchableOpacity>

                  <Text style={styles.seatCount}>{bookingDetails.numberOfSeats}</Text>

                  <TouchableOpacity
                    style={styles.seatButton}
                    onPress={() =>
                      setBookingDetails({
                        ...bookingDetails,
                        numberOfSeats: Math.min(availableSeats, bookingDetails.numberOfSeats + 1),
                      })
                    }
                    disabled={bookingDetails.numberOfSeats >= availableSeats}
                  >
                    <MaterialIcons
                      name="add"
                      size={24}
                      color={bookingDetails.numberOfSeats >= availableSeats ? '#ccc' : '#007AFF'}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.availableSeats}>{availableSeats} seats available</Text>

                {errors.numberOfSeats && (
                  <Text style={styles.errorText}>{errors.numberOfSeats}</Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Price Summary */}
        <Text style={styles.sectionTitle}>Price Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{bookingDetails.numberOfSeats} × Ticket</Text>
            <Text style={styles.summaryValue}>₦{trip.fare.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>₦500</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₦{(totalPrice + 500).toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.bookButtonText}>
              Book Now • ₦{(totalPrice + 500).toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripRoute: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 4,
    fontSize: 14,
  },
  seatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  seatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f8ff',
  },
  seatCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  availableSeats: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
