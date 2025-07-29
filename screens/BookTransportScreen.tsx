// screens/BookTransportScreen.tsx (No changes from the previous good version)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useRefreshControl from '../hooks/useRefreshControl'; // Assuming this hook works as is
import { formatDate } from '../utils/dateHelpers'; // Your existing date helper
import BusTripService from '../requests/busTripService'; // Corrected import path
import { BusTrip, BusTripFilters } from '../types/bustrip';
import TopNavBar from '../components/molecules/TopNavBar'; // Your existing component
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, BookTransportScreenProps } from '../types/screenprops'; // Using your specific props type

// Define a type for a unique trip route for display on the main screen
interface UniqueTripRoute {
  departureLocationName: string;
  departureLocationState: string;
  arrivalLocationName: string;
  arrivalLocationState: string;
  minFare: number;
  maxFare: number;
  availableDatesCount: number; // Number of distinct departure dates for this route
}

// Using your BookTransportScreenProps directly
export default function BookTransportScreen({ navigation }: BookTransportScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<BusTrip[]>([]); // This will hold ALL fetched trips
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100, // Fetch more to accurately group unique routes and dates
    total: 0,
    hasNext: false,
  });

  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchTrips(true);
    },
  });

  const fetchTrips = async (resetPage = false) => {
    try {
      setIsLoading(true);
      setError(null);
      let currentPage = resetPage ? 1 : pagination.page;

      const params: BusTripFilters = {
        status: 'scheduled',
        page: currentPage,
        limit: pagination.limit,
      };

      const response = await BusTripService.getScheduledBusTrips(params);

      // Append items if not resetting, otherwise start fresh
      setTrips(resetPage ? response.data.items : [...trips, ...response.data.items]);

      setPagination(prev => ({
        ...prev,
        page: currentPage,
        total: response.data.total,
        hasNext: response.data.hasNext,
      }));
    } catch (err) {
      setError('Failed to load trips. Please try again.');
      console.error('Error fetching trips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize unique trip routes and their aggregated info
  const uniqueTripRoutes = useMemo(() => {
    const routesMap = new Map<string, UniqueTripRoute>(); // Key: "departureName_departureState_arrivalName_arrivalState"

    trips.forEach(trip => {
      // Ensure essential properties exist before processing
      if (!trip.departure_location || !trip.departure_state || !trip.arrival_location || !trip.arrival_state || trip.fare === undefined || trip.fare === null || !trip.departure_time) {
        return;
      }

      const routeKey = `${trip.departure_location}_${trip.departure_state}_${trip.arrival_location}_${trip.arrival_state}`;
      const departureDateKey = formatDate(trip.departure_time as string, 'yyyy-MM-dd'); // Use just the date for grouping unique dates

      if (!routesMap.has(routeKey)) {
        routesMap.set(routeKey, {
          departureLocationName: trip.departure_location,
          departureLocationState: trip.departure_state,
          arrivalLocationName: trip.arrival_location,
          arrivalLocationState: trip.arrival_state,
          minFare: trip.fare,
          maxFare: trip.fare,
          availableDatesCount: 0, // Will be calculated below
        });
      }

      const currentRoute = routesMap.get(routeKey)!;
      currentRoute.minFare = Math.min(currentRoute.minFare, trip.fare);
      currentRoute.maxFare = Math.max(currentRoute.maxFare, trip.fare);

      // Use a temporary Set to count unique dates for this route
      if (!(currentRoute as any)._uniqueDates) {
        (currentRoute as any)._uniqueDates = new Set<string>();
      }
      (currentRoute as any)._uniqueDates.add(departureDateKey);
    });

    // Finalize the availableDatesCount after iterating through all trips
    const routesArray = Array.from(routesMap.values()).map(route => ({
      ...route,
      availableDatesCount: (route as any)._uniqueDates.size,
      _uniqueDates: undefined // Clean up temporary property
    }));

    // Filter by search term across all route parts
    const term = searchTerm.toLowerCase();
    const filtered = routesArray.filter(
      route =>
        route.departureLocationName.toLowerCase().includes(term) ||
        route.departureLocationState.toLowerCase().includes(term) ||
        route.arrivalLocationName.toLowerCase().includes(term) ||
        route.arrivalLocationState.toLowerCase().includes(term),
    );

    // Sort by departure location name, then arrival location name
    filtered.sort((a, b) => {
      const depCompare = a.departureLocationName.localeCompare(b.departureLocationName);
      if (depCompare !== 0) return depCompare;
      return a.arrivalLocationName.localeCompare(b.arrivalLocationName);
    });
    return filtered;
  }, [trips, searchTerm]); // Re-run memo if trips or search term change

  // Handle selecting a unique trip route
  const handleSelectRoute = (route: UniqueTripRoute) => {
    // Navigate to TripDatesScreen, passing the route details
    navigation.navigate('TripDates', {
      departureLocationName: route.departureLocationName,
      departureLocationState: route.departureLocationState,
      arrivalLocationName: route.arrivalLocationName,
      arrivalLocationState: route.arrivalLocationState,
    });
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchTrips(true);
  }, []); // Empty dependency array means this runs once on mount

  // For infinite scrolling: load more data when page changes
  useEffect(() => {
    if (pagination.page > 1) { // Prevents re-fetching on initial mount with page 1
      fetchTrips();
    }
  }, [pagination.page]);

  const handleLoadMore = () => {
    // Only load more if there's a next page and not already loading
    if (pagination.hasNext && !isLoading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar title={'Book Transport'} />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          // Check if we are 20 pixels from the bottom
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400} // Adjust throttle for performance
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={'Search by departure/arrival city or state...'}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>

        {isLoading && trips.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading available trip routes...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchTrips(true)}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Available Trip Routes ({uniqueTripRoutes.length})
            </Text>
            {uniqueTripRoutes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="route" size={60} color="#ddd" />
                <Text style={styles.emptyText}>No trip routes found.</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search criteria or refresh.</Text>
              </View>
            ) : (
              uniqueTripRoutes.map((route, index) => (
                <TouchableOpacity
                  key={`${route.departureLocationName}-${route.departureLocationState}-${route.arrivalLocationName}-${route.arrivalLocationState}-${index}`}
                  style={styles.routeCard}
                  onPress={() => handleSelectRoute(route)}
                >
                  <View style={styles.routeHeader}>
                    <View style={styles.routeTextContainer}>
                      <Text style={styles.routeLocationText}>
                        {route.departureLocationName} ({route.departureLocationState})
                      </Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={20}
                        color="#333"
                        style={styles.arrowIcon}
                      />
                      <Text style={styles.routeLocationText}>
                        {route.arrivalLocationName} ({route.arrivalLocationState})
                      </Text>
                    </View>
                    <Text style={styles.routePriceRange}>
                      ₦{route.minFare?.toLocaleString()}
                      {route.minFare !== route.maxFare ? ` - ₦${route.maxFare?.toLocaleString()}` : ''}
                    </Text>
                  </View>

                  <View style={styles.routeDetails}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="date-range" size={18} color="#666" />
                      <Text style={styles.detailText}>
                        {route.availableDatesCount} available departure dates
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewTripsButton}
                    onPress={() => handleSelectRoute(route)}
                  >
                    <Text style={styles.viewTripsButtonText}>View Dates</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
            {pagination.hasNext && !isLoading && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                <Text style={styles.loadMoreButtonText}>Load More Routes</Text>
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

// --- Styles ---
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
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
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
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  routeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    flexWrap: 'wrap',
  },
  routeLocationText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  routePriceRange: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  routeDetails: {
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
  viewTripsButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewTripsButtonText: {
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