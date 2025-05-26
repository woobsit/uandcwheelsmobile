import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image, // Add this import
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { LogisticsHomeScreenProps } from '../types/AuthProps';
import { DrawerActions } from '@react-navigation/native';

export default function LogisticsHomeScreen() {
  const navigation = useNavigation<LogisticsHomeScreenProps['navigation']>();

  // Mock data - replace with your API data
  const recentShipments = [
    { id: '12345', status: 'In Transit', route: 'Lagos → Abuja', date: 'Today, 10:30 AM' },
    { id: '12346', status: 'Delivered', route: 'Port Harcourt → Enugu', date: 'Yesterday' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} // Or open menu
        >
          <MaterialIcons name="menu" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Logistics Dashboard</Text>

        <View style={styles.iconsRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialIcons name="notifications" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 15 }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="settings" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Logistics Dashboard</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfile')}>
            <Image
              source={{ uri: 'https://i.imgur.com/mCHMpLT.png' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('NewShipment')}
          >
            <Text style={styles.actionText}>New Shipment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('TrackPackage')}
          >
            <Text style={styles.actionText}>Track Package</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Shipments */}
        <Text style={styles.sectionTitle}>Recent Shipments</Text>
        {recentShipments.map(shipment => (
          <TouchableOpacity
            key={shipment.id}
            style={styles.shipmentCard}
            onPress={() => navigation.navigate('ShipmentDetails', { id: shipment.id })}
          >
            <View>
              <Text style={styles.shipmentId}>#{shipment.id}</Text>
              <Text style={styles.shipmentRoute}>{shipment.route}</Text>
            </View>
            <View style={styles.shipmentRight}>
              <Text
                style={[
                  styles.shipmentStatus,
                  shipment.status === 'Delivered' ? styles.statusDelivered : styles.statusInTransit,
                ]}
              >
                {shipment.status}
              </Text>
              <Text style={styles.shipmentDate}>{shipment.date}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Monthly Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Shipments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦85,000</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>11</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  iconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#444',
  },
  shipmentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  shipmentId: {
    fontWeight: 'bold',
    color: '#333',
  },
  shipmentRoute: {
    color: '#666',
    marginTop: 4,
  },
  shipmentRight: {
    alignItems: 'flex-end',
  },
  shipmentStatus: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusDelivered: {
    color: '#4CAF50',
  },
  statusInTransit: {
    color: '#FF9800',
  },
  shipmentDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  statsTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: '#444',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#007AFF',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});
