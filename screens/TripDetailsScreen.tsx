// screens/TripDatesScreen.tsx
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
import useRefreshControl from '../hooks/useRefreshControl';
import { formatDate } from '../utils/dateHelpers';
import BusTripService from '../requests/busTripService';
import { BusTrip, BusTripFilters } from '../types/bustrip';
import TopNavBar from '../components/molecules/TopNavBar';
import { TripDatesScreenProps } from '../types/screenprops';

// Define a type for a unique departure date, which is now returned directly from the API
interface UniqueDepartureDate {
  dateString: string;
  minFare: number;
  maxFare: number;
  availableBusesCount: number;
}

export default function TripDatesScreen({ navigation, route }: TripDatesScreenProps) {
  const {
    departureLocationName,
    departureLocationState,
    arrivalLocationName,
    arrivalLocationState,
  } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  // tripsForRoute will now hold the grouped date objects from the API
  const [uniqueDepartureDates, setUniqueDepartureDates] = useState<UniqueDepartureDate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // We no longer need pagination state here since the API returns all grouped dates at once
  // or a single page of them. Let's simplify the fetch logic.
  
  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchGroupedDates();
    },
  });

  // Fetch trips specifically for the selected route
  const fetchGroupedDates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: BusTripFilters = {
        status: 'scheduled',
        // Do NOT include departureDate here, we want ALL dates for this route
        departureLocationName,
        departureLocationState,
        arrivalLocationName,
        arrivalLocationState,
      };

      const response = await BusTripService.getScheduledBusTrips(params);

      // The API now returns an array of grouped dates, so we set the state directly
      setUniqueDepartureDates(response.data.items);
    } catch (err) {
      setError('Failed to load trips for this route. Please try again.');
      console.error('Error fetching trips for route:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to TripDetailsScreen with specific route and date
  const handleSelectDate = (date: UniqueDepartureDate) => {
    navigation.navigate('TripDetails', {
      departureLocationName,
      departureLocationState,
      arrivalLocationName,
      arrivalLocationState,
      departureDate: date.dateString, // Pass the selected date string (YYYY-MM-DD)
    });
  };

  // Initial fetch for the route on component mount
  useEffect(() => {
    fetchGroupedDates();
  }, [departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState]);

  const screenTitle = `${departureLocationName} to ${arrivalLocationName}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title={screenTitle} />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {isLoading && uniqueDepartureDates.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading available dates...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchGroupedDates}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Select Departure Date ({uniqueDepartureDates.length})
            </Text>
            {uniqueDepartureDates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="calendar-today" size={60} color="#ddd" />
                <Text style={styles.emptyText}>No available dates for this route.</Text>
                <Text style={styles.emptySubtext}>
                  Please try another route or check back later.
                </Text>
              </View>
            ) : (
              uniqueDepartureDates.map((date, index) => (
                <TouchableOpacity
                  key={`${date.dateString}-${index}`}
                  style={styles.dateCard}
                  onPress={() => handleSelectDate(date)}
                >
                  <View style={styles.dateInfo}>
                    <MaterialIcons name="event" size={24} color="#007AFF" />
                    <View style={styles.dateTextContainer}>
                      <Text style={styles.dateDisplay}>{formatDate(date.dateString, 'EEE, MMM d, yyyy')}</Text>
                      <Text style={styles.dateBusCount}>
                        {date.availableBusesCount} bus options
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dateAction}>
                    <Text style={styles.datePriceRange}>
                      ₦{date.minFare?.toLocaleString()}
                      {date.minFare !== date.maxFare ? ` - ₦${date.maxFare?.toLocaleString()}` : ''}
                    </Text>
                    <MaterialIcons name="navigate-next" size={24} color="#007AFF" />
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#444',
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateTextContainer: {
    marginLeft: 10,
  },
  dateDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateBusCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePriceRange: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 8,
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