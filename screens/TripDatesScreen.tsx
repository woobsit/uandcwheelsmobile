// screens/TripDatesScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import useRefreshControl from '../hooks/useRefreshControl'; // Your existing hook
import { formatDate } from '../utils/dateHelpers'; // Your existing date helper
import BusTripService from '../requests/busTripService'; // Corrected import path
import { BusTrip, BusTripFilters } from '../types/bustrip';
import TopNavBar from '../components/molecules/TopNavBar'; // Your existing component
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, TripDatesScreenProps } from '../types/screenprops'; // Using your specific props type

// Define a type for a unique departure date for display
interface UniqueDepartureDate {
  dateString: string; // e.g., '2025-07-30' (for internal filtering)
  displayDate: string; // e.g., 'Wed, Jul 30, 2025' (for display)
  minFare: number;
  maxFare: number;
  availableBusesCount: number; // Number of distinct bus trips on this date for this route
}

// Using your TripDatesScreenProps directly
export default function TripDatesScreen({ navigation, route }: TripDatesScreenProps) {
  const {
    departureLocationName,
    departureLocationState,
    arrivalLocationName,
    arrivalLocationState,
  } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [tripsForRoute, setTripsForRoute] = useState<BusTrip[]>([]); // All trips matching the route
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Fetch enough to cover all dates for a given route typically
    total: 0,
    hasNext: false,
  });

  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchTripsForRoute(true);
    },
  });
  // Fetch trips specifically for the selected route
  // Fetch trips specifically for the selected route, fetching all pages if necessary
  const fetchTripsForRoute = async (resetPage = false) => {
    try {
      setIsLoading(true);
      setError(null);

      let allItems: BusTrip[] = [];
      let currentPage = 1;
      let hasNextPage = true;

      // Reset trips if this is a refresh or initial load
      if (resetPage) {
        setTripsForRoute([]);
      } else {
        allItems = [...tripsForRoute];
      }

      while (hasNextPage) {
        const params: BusTripFilters = {
          status: 'scheduled',
          page: currentPage,
          limit: pagination.limit,
          departureLocationName,
          departureLocationState,
          arrivalLocationName,
          arrivalLocationState,
        };

        const response = await BusTripService.getScheduledBusTrips(params);

        // Append new items to our growing list
        allItems = [...allItems, ...response.data.items];

        // Update the pagination state based on the last response
        hasNextPage = response.data.hasNext;
        currentPage++;

        // Safety break to prevent infinite loops with a misconfigured API
        if (currentPage > 50) {
          console.warn('Reached page limit of 50. Breaking fetch loop.');
          break;
        }
      }

      // After fetching all pages, set the final state
      setTripsForRoute(allItems);
      setPagination(prev => ({
        ...prev,
        page: currentPage - 1,
        total: allItems.length,
        hasNext: false, // All data is loaded, so there's no next page
      }));
    } catch (err) {
      setError('Failed to load trips for this route. Please try again.');
      console.error('Error fetching trips for route:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove the second useEffect that listens for pagination.page changes,
  // as the new fetch function handles it internally.
  useEffect(() => {
    fetchTripsForRoute(true);
  }, [departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState]);
  // Memoize unique departure dates for the selected route
  const uniqueDepartureDates = useMemo(() => {
    const datesMap = new Map<string, UniqueDepartureDate>(); // Key: 'yyyy-MM-dd'

    tripsForRoute.forEach(trip => {
      // Ensure fare and departure_time exist for aggregation
      if (!trip.fare || !trip.departure_time) return;

      const dateKey = formatDate(trip.departure_time as string, 'yyyy-MM-dd');
      // Use your existing format for display or adjust as needed
      const displayDate = formatDate(trip.departure_time as string, 'EEE, MMM d, yyyy'); // Example: "Wed, Jul 30, 2025"

      if (!datesMap.has(dateKey)) {
        datesMap.set(dateKey, {
          dateString: dateKey,
          displayDate: displayDate,
          minFare: trip.fare,
          maxFare: trip.fare,
          availableBusesCount: 0, // Will be counted below
        });
      }

      const currentDate = datesMap.get(dateKey)!;
      currentDate.minFare = Math.min(currentDate.minFare, trip.fare);
      currentDate.maxFare = Math.max(currentDate.maxFare, trip.fare);
      currentDate.availableBusesCount++; // Count each individual bus trip on this date
    });

    const datesArray = Array.from(datesMap.values());
    // Sort dates chronologically
    datesArray.sort((a, b) => new Date(a.dateString).getTime() - new Date(b.dateString).getTime());
    return datesArray;
  }, [tripsForRoute]); // Re-run memo if tripsForRoute change

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
    fetchTripsForRoute(true);
  }, [departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState]); // Re-fetch if route params change

  // For infinite scrolling: load more data when page changes
  useEffect(() => {
    if (pagination.page > 1) {
      fetchTripsForRoute();
    }
  }, [pagination.page]);

  const handleLoadMore = () => {
    if (pagination.hasNext && !isLoading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const screenTitle = `${departureLocationName} to ${arrivalLocationName}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* <TopNavBar title={screenTitle} onBackPress={navigation.goBack} /> */}
      <TopNavBar title={screenTitle} />

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
        {isLoading && tripsForRoute.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading available dates...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchTripsForRoute(true)}>
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
                      <Text style={styles.dateDisplay}>{date.displayDate}</Text>
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
            {pagination.hasNext && !isLoading && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                <Text style={styles.loadMoreButtonText}>Load More Dates</Text>
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
  loadMoreButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loadMoreButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
