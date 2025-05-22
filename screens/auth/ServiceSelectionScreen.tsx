import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { ServiceSelectionScreenProps } from '../../types/AuthProps';

export default function ServiceSelectionScreen() {
  const navigation = useNavigation<ServiceSelectionScreenProps['navigation']>();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

      {/* Instruction Text */}
      <Text style={styles.title}>Please select a service</Text>

      {/* Service Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.serviceButton, styles.logisticsButton]}
          onPress={() => navigation.navigate('LogisticsHome')}
        >
          <Text style={styles.buttonText}>Logistics</Text>
          <Text style={styles.buttonSubtext}>Ship packages & goods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceButton, styles.transportButton]}
          onPress={() => navigation.navigate('TransportHome')}
        >
          <Text style={styles.buttonText}>Transport</Text>
          <Text style={styles.buttonSubtext}>Book passenger vehicles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 40,
    color: '#333',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  serviceButton: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logisticsButton: {
    backgroundColor: '#4CAF50', // Green color for logistics
  },
  transportButton: {
    backgroundColor: '#2196F3', // Blue color for transport
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});
