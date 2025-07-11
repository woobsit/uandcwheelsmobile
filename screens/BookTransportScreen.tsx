import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useRefreshControl from '../hooks/useRefreshControl';
import { Trip } from '../types/trip';
import { formatDate } from '../utils/dateHelpers';
import { TripService } from '../requests';
import TopNavBar from '../components/molecules/TopNavBar';

export default function BookTransportScreen() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Create refresh control
  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchTrips();
    },
  });

  // Fetch trips from API
  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await TripService.getAvailableTrips();
      setTrips(response.data);
    } catch (err) {
      setError('Failed to load trips. Please try again.');
      console.error('Error fetching trips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter trips based on search term
  const filteredTrips = trips.filter(
    trip =>
      trip.departure_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.arrival_location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle booking
  const handleBookTrip = (trip: Trip) => {
    navigation.navigate('BookingDetails', { trip });
  };

  // Initial fetch
  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title="Book Transport" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search departure or arrival locations..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading available trips...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTrips}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="directions-bus" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No trips found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Available Trips ({filteredTrips.length})</Text>

            {filteredTrips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => handleBookTrip(trip)}
              >
                <View style={styles.tripHeader}>
                  <Text style={styles.tripRoute}>
                    {trip.departure_location} → {trip.arrival_location}
                  </Text>
                  <Text style={styles.tripPrice}>₦{trip.fare.toLocaleString()}</Text>
                </View>

                <View style={styles.tripDetails}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      {formatDate(trip.departure_time, 'hh:mm a')} -{' '}
                      {formatDate(trip.estimated_arrival, 'hh:mm a')}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialIcons name="event" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      {formatDate(trip.departure_time, 'MMM d, yyyy')}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialIcons name="directions-bus" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      {trip.bus?.type || 'Standard Bus'} • {trip.bus?.seat_capacity || 'Unknown'}{' '}
                      seats
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialIcons name="person" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      {trip.driver?.name || 'Driver information not available'}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.statusText,
                      trip.status === 'scheduled'
                        ? styles.statusScheduled
                        : trip.status === 'ongoing'
                          ? styles.statusOngoing
                          : trip.status === 'completed'
                            ? styles.statusCompleted
                            : styles.statusCancelled,
                    ]}
                  >
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </Text>
                </View>

                <TouchableOpacity style={styles.bookButton} onPress={() => handleBookTrip(trip)}>
                  <Text style={styles.bookButtonText}>Book This Trip</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#444',
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  tripRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  tripPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tripDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 15,
    flex: 1,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusText: {
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusScheduled: {
    backgroundColor: '#e8f4ff',
    color: '#007AFF',
  },
  statusOngoing: {
    backgroundColor: '#fff8e1',
    color: '#ff9800',
  },
  statusCompleted: {
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
  },
  statusCancelled: {
    backgroundColor: '#ffebee',
    color: '#f44336',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
