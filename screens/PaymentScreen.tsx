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
import { PaymentMethod } from '../types/booking';
import BookingService from '../requests/bookingService'; 

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
      const finalBookingPayload = {
        ...bookingPayload,
        payment_method: selectedPaymentMethod,
      };

      const response = await BookingService.createBooking(finalBookingPayload);
console.log("Response", response);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title="Payment" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Booking Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Summary</Text>
          <View style={styles.summaryDetailsRow}>
            <Text style={styles.summaryLabel}>Total Passengers</Text>
            <Text style={styles.summaryValue}>
              {bookingPayload.adult_count +
                bookingPayload.seated_child_count +
                bookingPayload.lap_child_count}
            </Text>
          </View>
          <View style={styles.summaryDetailsRow}>
            <Text style={styles.summaryLabel}>Seats Occupied</Text>
            <Text style={styles.summaryValue}>
              {bookingPayload.adult_count + bookingPayload.seated_child_count}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount Due</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(bookingPayload.total_amount)}
            </Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        <View style={[styles.card, styles.paymentMethodsContainer]}>
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
        </View>

        {error && <Text style={styles.errorMessage}>{error}</Text>}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedPaymentMethod && styles.confirmButtonDisabled]}
          onPress={handleProcessPayment}
          disabled={!selectedPaymentMethod || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0A2540" />
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
    backgroundColor: '#0A2540',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A2540',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%', 
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#eee',
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
  paymentMethodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#FFC107',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#0A2540',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});