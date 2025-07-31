// screens/BookingConfirmationScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import TopNavBar from '../components/molecules/TopNavBar';
import { BookingConfirmationScreenProps } from '../types/screenprops';

export default function BookingConfirmationScreen() {
  const navigation = useNavigation<BookingConfirmationScreenProps['navigation']>();
  const route = useRoute<BookingConfirmationScreenProps['route']>();

  const { bookingReference, bookingId } = route.params; // Get passed data

  const handleViewMyBookings = () => {
    // Navigate to a screen that lists user's bookings (you'll need to implement this)
    // For now, let's navigate to Dashboard or a placeholder
    navigation.popToTop(); // Go back to the very first screen in the stack
    // Or navigation.navigate('MyBookings');
  };

  const handleGoToDashboard = () => {
    navigation.popToTop(); // Go to the root of the stack, often the Dashboard
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title="Booking Confirmed!" canGoBack={false} /> {/* No back button */}

      <View style={styles.container}>
        <View style={styles.confirmationCard}>
          <MaterialIcons name="check-circle" size={100} color="#28a745" style={styles.icon} />
          <Text style={styles.title}>Your Booking is Confirmed!</Text>
          <Text style={styles.message}>
            Thank you for booking with us. Your trip details are below.
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking Reference:</Text>
            <Text style={styles.detailValue}>{bookingReference}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID:</Text>
            <Text style={styles.detailValue}>{bookingId}</Text>
          </View>
          {/* Add more relevant booking details here if available from the API response */}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleViewMyBookings}>
          <AntDesign name="book" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>View My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonOutline} onPress={handleGoToDashboard}>
          <AntDesign name="home" size={20} color="#007AFF" style={styles.buttonIcon} />
          <Text style={styles.buttonOutlineText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  confirmationCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 15,
  },
  buttonOutline: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonOutlineText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 5,
  },
});