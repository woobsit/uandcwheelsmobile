// screens/PaymentScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import TopNavBar from '../components/molecules/TopNavBar';
import { PaymentScreenProps } from '../types/screenprops';
import { CreateBookingPayload } from '../types/booking';
import { PaymentMethod } from '../types/booking';
import BookingService from '../requests/bookingService'; // You'll create this service

// Helper to format currency
const formatCurrency = (amount: number) => `₦${amount?.toLocaleString()}`;

export default function PaymentScreen() {
  const navigation = useNavigation<PaymentScreenProps['navigation']>();
  const route = useRoute<PaymentScreenProps['route']>();

  const { bookingPayload } = route.params;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Modify payload to include selected payment method
      const finalBookingPayload: CreateBookingPayload = {
        ...bookingPayload,
        payment_method: selectedPaymentMethod,
      };

      // Call your backend API to create the booking
      // You'll need to implement BookingService.createBooking
      const response = await BookingService.createBooking(finalBookingPayload);

      if (response.success && response.data) {
        Alert.alert(
          'Booking Confirmed!',
          `Your booking reference is: ${response.data.booking_reference}`,
        );
        navigation.replace('BookingConfirmation', {
          bookingReference: response.data.booking_reference,
          bookingId: response.data.id,
        });
      } else {
        setError(response.message || 'Failed to confirm booking. Please try again.');
      }
    } catch (err) {
      console.error('Error processing payment/booking:', err);
      setError('An error occurred during booking. Please try again or contact support.');
      // You might want to parse err.response.data for more specific error messages from backend
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title="Payment" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <Text style={styles.summaryDetails}>
            Total Passengers:{' '}
            {bookingPayload.adult_count +
              bookingPayload.seated_child_count +
              bookingPayload.lap_child_count}
          </Text>
          <Text style={styles.summaryDetails}>
            Seats Occupied: {bookingPayload.adult_count + bookingPayload.seated_child_count}
          </Text>
          <Text style={styles.summaryTotal}>
            Amount Due: {formatCurrency(bookingPayload.total_amount)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        <View style={styles.paymentMethodsContainer}>
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === PaymentMethod.CASH && styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod(PaymentMethod.CASH)}
          >
            <MaterialIcons
              name="money"
              size={30}
              color={selectedPaymentMethod === PaymentMethod.CASH ? 'white' : '#007AFF'}
            />
            <Text
              style={[
                styles.paymentMethodText,
                selectedPaymentMethod === PaymentMethod.CASH && { color: 'white' },
              ]}
            >
              Pay Cash at Terminal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === PaymentMethod.BANK_TRANSFER && styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod(PaymentMethod.BANK_TRANSFER)}
          >
            <MaterialIcons
              name="account-balance"
              size={30}
              color={selectedPaymentMethod === PaymentMethod.BANK_TRANSFER ? 'white' : '#007AFF'}
            />
            <Text
              style={[
                styles.paymentMethodText,
                selectedPaymentMethod === PaymentMethod.BANK_TRANSFER && { color: 'white' },
              ]}
            >
              Bank Transfer
            </Text>
          </TouchableOpacity>

          {/* Add more payment methods here as supported by your backend */}
          {/* Example:
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === PaymentMethod.CREDIT_CARD && styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod(PaymentMethod.CREDIT_CARD)}
          >
            <MaterialIcons name="credit-card" size={30} color={selectedPaymentMethod === PaymentMethod.CREDIT_CARD ? 'white' : '#007AFF'} />
            <Text style={[styles.paymentMethodText, selectedPaymentMethod === PaymentMethod.CREDIT_CARD && { color: 'white' }]}>Credit/Debit Card</Text>
          </TouchableOpacity>
          */}
        </View>

        {error && <Text style={styles.errorMessage}>{error}</Text>}

        <TouchableOpacity
          style={[styles.confirmButton, !selectedPaymentMethod && styles.confirmButtonDisabled]}
          onPress={handleProcessPayment}
          disabled={!selectedPaymentMethod || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking & Pay</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  summaryDetails: {
    fontSize: 15,
    color: '#555',
    marginBottom: 3,
  },
  summaryTotal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%', // Approx half width
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
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
  paymentMethodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButtonDisabled: {
    backgroundColor: '#cccccc',
  },
});
