import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { DashboardScreenProps } from '../types/screenprops';
import TopNavBar from '../components/molecules/TopNavBar'; // Correct import
import useRefreshControl from '../hooks/useRefreshControl';

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenProps['navigation']>();

  const scrollViewRef = useRef<ScrollView>(null);
  // Create refresh control logic
  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      // Scroll to top after refresh
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    },
  });

  // Mock data - replace with your API data
  const recentShipments = [
    { id: '12345', status: 'In Transit', route: 'Lagos → Abuja', date: 'Today, 10:30 AM' },
    { id: '12346', status: 'Delivered', route: 'Port Harcourt → Enugu', date: 'Yesterday' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Navigation Bar Component */}
      <TopNavBar title="Dashboard" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff" // Changed to white for better contrast
            title="Refreshing..."
            titleColor="#fff"
            colors={['#fff']}
            progressBackgroundColor="#0A2540"
          />
        }
      >
        {/* The rest of the content scrolls below the TopNavBar */}
        <View style={styles.contentWrapper}>
            
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfile')}>
              <Image
                source={{ uri: 'https://i.imgur.com/mCHMpLT.png' }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Actions Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('BookTransport')}
              >
                <Text style={styles.actionText}>Book Transport</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('TrackPackage')}
              >
                <Text style={styles.actionText}>Use Dispatch</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Trips Card 
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Trips</Text>
            {recentShipments.map(shipment => (
              <TouchableOpacity
                key={shipment.id}
                style={styles.shipmentCard}
                // onPress={() => navigation.navigate('ShipmentDetails', { id: shipment.id })}
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
          </View>

          {/* Statistics Card 
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Summary</Text>
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
          </View>*/}
        </View>
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
    backgroundColor: '#0A2540',
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
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
    marginBottom: 15,
    color: '#0A2540',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shipmentCard: {
    backgroundColor: '#F7F9FC',
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  shipmentId: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  shipmentRoute: {
    color: '#666',
    marginTop: 5,
  },
  shipmentRight: {
    alignItems: 'flex-end',
  },
  shipmentStatus: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusDelivered: {
    color: '#28a745',
  },
  statusInTransit: {
    color: '#ffc107',
  },
  shipmentDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#0A2540',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});