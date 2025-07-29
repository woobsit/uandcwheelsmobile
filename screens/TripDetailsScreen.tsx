// screens/TripDetailsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import useRefreshControl from '../hooks/useRefreshControl'; // Your existing hook
import { formatDate } from '../utils/dateHelpers'; // Your existing date helper
import BusTripService from '../requests/busTripService'; // Corrected import path
import { BusTrip, BusTripFilters } from '../types/bustrip';
import TopNavBar from '../components/molecules/TopNavBar'; // Your existing component
import { TripDetailsScreenProps } from '../types/screenprops'; // Using your specific props type

// Using your TripDetailsScreenProps directly
export default function TripDetailsScreen({ navigation, route }: TripDetailsScreenProps) {
  // Extract all relevant parameters from the route
  const {
    departureLocationName,
    departureLocationState,
    arrivalLocationName,
    arrivalLocationState,
    departureDate, // This is the new crucial parameter from TripDatesScreen
    selectedTripId // Kept optional, if you have a flow that navigates directly to a single trip by ID
  } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [busesForDate, setBusesForDate] = useState<BusTrip[]>([]); // Specific buses for the chosen route and date
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Standard limit for individual trips
    total: 0,
    hasNext: false,
  });

  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchBusesForDate(true);
    },
  });

  // Fetch individual bus trips matching the route and date
  const fetchBusesForDate = async (resetPage = false) => {
    try {
      setIsLoading(true);
      setError(null);
      let currentPage = resetPage ? 1 : pagination.page;

      const params: BusTripFilters = {
        status: 'scheduled',
        page: currentPage,
        limit: pagination.limit,
        departureLocationName,
        departureLocationState,
        arrivalLocationName,
        arrivalLocationState,
        date: departureDate, // Pass the selected date string (YYYY-MM-DD) for filtering
      };

      const response = await BusTripService.getScheduledBusTrips(params);

      setBusesForDate(resetPage ? response.data.items : [...busesForDate, ...response.data.items]);

      setPagination(prev => ({
        ...prev,
        page: currentPage,
        total: response.data.total,
        hasNext: response.data.hasNext,
      }));
    } catch (err) {
      setError('Failed to load bus options. Please try again.');
      console.error('Error fetching buses for date:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSpecificTrip = (trip: BusTrip) => {
    // This is where the user commits to a specific bus/time.
    // You would typically navigate to a SeatSelectionScreen or a PaymentScreen from here,
    // passing the full `trip` object or its `id` and any other accumulated booking details.
    console.log('User selected trip:', trip.id);
    alert(`Selected Trip: ${trip.departure_location} to ${trip.arrival_location}\nTime: ${formatDate(trip.departure_time as string, 'hh:mm a')}\nBus: ${trip.bus?.brand || 'N/A'}`);
    // Example: navigation.navigate('BookingConfirmation', { booking: { tripId: trip.id, passengerInfo: {} } });
    // Make sure 'BookingConfirmation' is in your AuthStackParamList and accepts these props.
  };

  useEffect(() => {
    // Only fetch if all necessary route and date parameters are present
    if (departureLocationName && departureLocationState && arrivalLocationName && arrivalLocationState && departureDate) {
      fetchBusesForDate(true);
    } else if (selectedTripId) {
      // Fallback for direct tripId navigation if still used in some flows.
      // You would fetch a single trip by ID here if selectedTripId is the only parameter.
      // This part might need adjustment if selectedTripId is only used for highlighting.
      BusTripService.getBusTripDetails(String(selectedTripId)).then(response => {
        if (response.data) {
          setBusesForDate([response.data]);
        } else {
          setError("Trip details not found.");
        }
      }).catch(err => {
        setError("Failed to load specific trip details.");
        console.error("Error fetching specific trip:", err);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setError("Missing route or trip information to display details.");
      setIsLoading(false);
    }
  }, [departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState, departureDate, selectedTripId]); // Depend on all relevant route/date params

  const handleLoadMore = () => {
    if (pagination.hasNext && !isLoading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  useEffect(() => {
    if (pagination.page > 1) {
      fetchBusesForDate();
    }
  }, [pagination.page]);


  const screenTitle = departureDate
    ? `${departureLocationName} to ${arrivalLocationName} on ${formatDate(departureDate, 'MMM d, yyyy')}`
    : 'Trip Details'; // Fallback title

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title={screenTitle} onBackPress={navigation.goBack} />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {isLoading && busesForDate.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading bus options...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchBusesForDate(true)}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Available Buses ({busesForDate.length})
            </Text>
            {busesForDate.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="bus_alert" size={60} color="#ddd" />
                <Text style={styles.emptyText}>No buses found for this date.</Text>
                <Text style={styles.emptySubtext}>Try another date or route.</Text>
              </View>
            ) : (
              busesForDate.map(trip => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => handleBookSpecificTrip(trip)}
                >
                  <View style={styles.tripHeader}>
                    <Text style={styles.tripRoute}>
                      {formatDate(trip.departure_time as string, 'hh:mm a')} -{' '}
                      {formatDate(trip.estimated_arrival as string, 'hh:mm a')}
                    </Text>
                    <Text style={styles.tripPrice}>₦{trip.fare?.toLocaleString()}</Text>
                  </View>

                  <View style={styles.tripDetails}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="directions_bus" size={18} color="#666" />
                      <Text style={styles.detailText}>
                        Bus: {trip.bus?.brand || 'Standard Bus'} • {trip.bus?.capacity || 'N/A'}{' '}
                        seats ({trip.bus?.plate_number})
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <MaterialIcons name="airline_seat_recline_normal" size={18} color="#666" />
                      <Text style={styles.detailText}>
                        Available Seats: {trip.available_seats}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <MaterialIcons name="person" size={18} color="#666" />
                      <Text style={styles.detailText}>
                        Driver: {trip.driver?.name || 'Information not available'}
                      </Text>
                    </View>
                     <View style={styles.detailItem}>
                      <MaterialIcons name="departure_board" size={18} color="#666" />
                      <Text style={styles.detailText}>
                        Dep. Terminal: {trip.departure_terminal || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="place" size={18} color="#666" />
                      <Text style={styles.detailText}>
                        Arr. Terminal: {trip.arrival_terminal || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusContainer}>
                    <Text
                      style={[
                        styles.statusText,
                        trip.status === 'scheduled'
                          ? styles.statusScheduled
                          : trip.status === 'boarding'
                          ? styles.statusOngoing
                          : trip.status === 'departed'
                          ? styles.statusOngoing
                          : trip.status === 'arrived'
                          ? styles.statusCompleted
                          : styles.statusCancelled,
                      ]}
                    >
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleBookSpecificTrip(trip)}
                  >
                    <Text style={styles.bookButtonText}>Select This Bus</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
            {pagination.hasNext && !isLoading && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                <Text style={styles.loadMoreButtonText}>Load More Buses</Text>
              </TouchableOpacity>
            )}
            {isLoading && pagination.page > 1 && (
              <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 16, backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#444' },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
      android: { elevation: 2 },
    }),
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
  tripRoute: { fontSize: 17, fontWeight: 'bold', color: '#333' }, // Now displays time range
  tripPrice: { fontSize: 17, fontWeight: 'bold', color: '#007AFF' },
  tripDetails: { marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { marginLeft: 8, color: '#666', fontSize: 15, flex: 1 },
  statusContainer: { marginBottom: 16 },
  statusText: {
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusScheduled: { backgroundColor: '#e8f4ff', color: '#007AFF' },
  statusOngoing: { backgroundColor: '#fff8e1', color: '#ff9800' },
  statusCompleted: { backgroundColor: '#e8f5e9', color: '#4caf50' },
  statusCancelled: { backgroundColor: '#ffebee', color: '#f44336' },
  bookButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  bookButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 20, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 20, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: { color: 'white', fontWeight: 'bold' },
  loadMoreButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loadMoreButtonText: { color: '#333', fontWeight: 'bold' },
});