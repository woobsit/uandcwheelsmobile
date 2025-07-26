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
// import { Trip } from '../types/trip'; // Your existing Trip type - WE WILL UPDATE THIS INLINE
import { formatDate } from '../utils/dateHelpers'; // Your existing date helper
import { TripService } from '../requests'; // Your API service
import TopNavBar from '../components/molecules/TopNavBar'; // Your existing component
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/screenprops';

// --- UPDATED TRIP TYPE DEFINITION ---
// This type should accurately reflect the structure returned by your backend's getAllScheduledTrips
export interface Trip {
  id: string; // This is the BusTrip ID
  departure_time: string;
  estimated_arrival: string;
  fare: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  available_seats: number; // This comes directly from the backend's BusTrip response

  // Location details are flattened in your backend response for convenience
  departure_location: string;
  departure_state: string;
  departure_terminal: string;
  arrival_location: string;
  arrival_state: string;
  arrival_terminal: string;

  // Nested Bus and Driver objects
  Bus?: {
    // Make optional, though your backend ensures they exist
    plate_number: string;
    brand: string;
    capacity: number;
  };
  Driver?: {
    // Make optional
    name: string;
    license_number: string;
  };
}
// --- END UPDATED TRIP TYPE DEFINITION ---

// Define a type for a unique location for display
interface UniqueLocation {
  name: string;
  state: string;
  // type: 'departure' | 'arrival'; // Removed, as we'll search both ways
  count: number; // Number of trips associated with this location
}

export default function BookTransportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // New state for selected location (when drilling down)
  const [selectedLocation, setSelectedLocation] = useState<UniqueLocation | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasNext: false,
  });

  // Create refresh control
  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      // If a location is selected, refresh for that location's trips
      // Otherwise, refresh the initial location list
      await fetchTrips(
        selectedLocation
          ? {
              locationName: selectedLocation.name,
              locationState: selectedLocation.state,
            }
          : undefined,
        true,
      ); // Pass true to reset pagination on refresh
    },
  });

  // Fetch trips or unique locations from API
  // Add a parameter to optionally filter by a specific location
  const fetchTrips = async (
    filter?: { locationName?: string; locationState?: string },
    resetPage = false,
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      let currentPage = resetPage ? 1 : pagination.page;

      const params: any = {
        status: 'scheduled',
        page: currentPage,
        limit: pagination.limit,
      };

      if (filter?.locationName && filter?.locationState) {
        // If a specific location is selected, fetch trips for that location
        // The backend is now designed to filter by these parameters for both departure and arrival
        params.departureLocationName = filter.locationName;
        params.departureLocationState = filter.locationState;
        params.arrivalLocationName = filter.locationName;
        params.arrivalLocationState = filter.locationState;
      }

      const response = await TripService.getAllTrips(params);

      // If resetting page, start with a fresh list, otherwise append for infinite scroll
      setTrips(resetPage ? response.data.items : [...trips, ...response.data.items]);

      setPagination(prev => ({
        ...prev,
        page: currentPage, // Update page to the current page
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

  // Memoize unique locations to avoid re-calculating on every render
  const uniqueLocations = useMemo(() => {
    const locationsMap = new Map<string, UniqueLocation>(); // Key: "name_state"

    trips.forEach(trip => {
      // Handle departure location
      if (trip.departure_location && trip.departure_state) {
        const key = `${trip.departure_location}_${trip.departure_state}`;
        if (!locationsMap.has(key)) {
          locationsMap.set(key, {
            name: trip.departure_location,
            state: trip.departure_state,
            count: 0, // Will count later
          });
        }
        locationsMap.get(key)!.count++;
      }

      // Handle arrival location
      if (trip.arrival_location && trip.arrival_state) {
        const key = `${trip.arrival_location}_${trip.arrival_state}`;
        if (!locationsMap.has(key)) {
          locationsMap.set(key, {
            name: trip.arrival_location,
            state: trip.arrival_state,
            count: 0, // Will count later
          });
        }
        locationsMap.get(key)!.count++;
      }
    });

    // Filter by search term on the STATE name
    const term = searchTerm.toLowerCase();
    const filtered = Array.from(locationsMap.values()).filter(location =>
      location.state.toLowerCase().includes(term),
    );

    // Sort by location name
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [trips, searchTerm]); // Re-calculate when trips or searchTerm changes

  // Filter trips based on search term when a location IS selected
  // This now only filters by searchTerm on the already API-filtered 'trips' array
  const filteredTrips = useMemo(() => {
    if (!selectedLocation) {
      return []; // Should not be called if no location is selected
    }
    const term = searchTerm.toLowerCase();
    // The 'trips' array will already contain only trips relevant to `selectedLocation`
    // due to the `fetchTrips` call. So, we just filter by the search term on location names.
    return trips.filter(
      trip =>
        trip.departure_location?.toLowerCase().includes(term) ||
        trip.arrival_location?.toLowerCase().includes(term) ||
        trip.departure_state?.toLowerCase().includes(term) || // Allow searching by state within trips
        trip.arrival_state?.toLowerCase().includes(term),
    );
  }, [trips, searchTerm, selectedLocation]);

  // Handle selecting a location to view its trips
  const handleSelectLocation = (location: UniqueLocation) => {
    setSelectedLocation(location);
    // Reset pagination and fetch trips for this specific location
    fetchTrips(
      {
        locationName: location.name,
        locationState: location.state,
      },
      true,
    ); // Reset page to 1
  };

  // Go back from trip list to location list
  const handleBackToLocations = () => {
    setSelectedLocation(null);
    setSearchTerm(''); // Clear search when going back
    fetchTrips(undefined, true); // Re-fetch initial unique locations (all trips)
  };

  const handleBookTrip = (trip: Trip) => {
    // Navigate to the booking details screen, passing the trip ID or full trip object
    navigation.navigate('TripDetails', { tripId: trip.id }); // Assuming you have a TripDetails screen
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchTrips();
  }, []); // Empty dependency array means this runs once on mount

  // You'd want to handle "Load More" for pagination here if you implement it
  // const handleLoadMore = () => {
  //   if (pagination.hasNext && !isLoading) {
  //     setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  //     fetchTrips(selectedLocation ? {
  //       locationName: selectedLocation.name,
  //       locationState: selectedLocation.state,
  //     } : undefined);
  //   }
  // };
  // const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  //   const paddingToBottom = 20; // How close to bottom to trigger load more
  //   return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  // };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopNavBar
        title={
          selectedLocation
            ? `${selectedLocation.name}, ${selectedLocation.state} Trips`
            : 'Book Transport'
        }
        onBackPress={selectedLocation ? handleBackToLocations : undefined} // Show back button when location selected
      />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        // onScroll={({ nativeEvent }) => { // Uncomment for infinite scroll
        //   if (isCloseToBottom(nativeEvent)) {
        //     handleLoadMore();
        //   }
        // }}
        // scrollEventThrottle={400} // Adjust as needed
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={selectedLocation ? 'Search within trips...' : 'Search by state name...'}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {selectedLocation
                ? 'Loading trips for this location...'
                : 'Loading available locations...'}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                fetchTrips(
                  selectedLocation
                    ? {
                        locationName: selectedLocation.name,
                        locationState: selectedLocation.state,
                      }
                    : undefined,
                  true,
                )
              }
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {selectedLocation ? (
              // Display actual trips for the selected location
              <>
                <Text style={styles.sectionTitle}>
                  Trips from/to {selectedLocation.name}, {selectedLocation.state} (
                  {filteredTrips.length})
                </Text>
                {filteredTrips.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="directions-bus" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>No trips found for this location</Text>
                    <Text style={styles.emptySubtext}>Try a different search or go back</Text>
                  </View>
                ) : (
                  filteredTrips.map(trip => (
                    <TouchableOpacity
                      key={trip.id}
                      style={styles.tripCard}
                      onPress={() => handleBookTrip(trip)}
                    >
                      <View style={styles.tripHeader}>
                        <Text style={styles.tripRoute}>
                          {trip.departure_location} → {trip.arrival_location}
                        </Text>
                        <Text style={styles.tripPrice}>₦{trip.fare?.toLocaleString()}</Text>
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
                            {trip.Bus?.brand || 'Standard Bus'} • {trip.Bus?.capacity || 'Unknown'}{' '}
                            seats
                          </Text>
                        </View>

                        <View style={styles.detailItem}>
                          <MaterialIcons
                            name="airline-seat-recline-normal"
                            size={18}
                            color="#666"
                          />
                          <Text style={styles.detailText}>
                            Available Seats: {trip.available_seats}
                          </Text>
                        </View>

                        <View style={styles.detailItem}>
                          <MaterialIcons name="person" size={18} color="#666" />
                          <Text style={styles.detailText}>
                            {trip.Driver?.name || 'Driver information not available'}
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

                      <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => handleBookTrip(trip)}
                      >
                        <Text style={styles.bookButtonText}>Book This Trip</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              // Display unique locations if no location is selected
              <>
                <Text style={styles.sectionTitle}>
                  Explore Locations ({uniqueLocations.length})
                </Text>
                {uniqueLocations.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="location-city" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>No locations found</Text>
                    <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
                  </View>
                ) : (
                  uniqueLocations.map((location, index) => (
                    <TouchableOpacity
                      key={`${location.name}-${location.state}-${index}`} // Unique key for locations
                      style={styles.locationCard}
                      onPress={() => handleSelectLocation(location)}
                    >
                      <View style={styles.locationInfo}>
                        <MaterialIcons name="place" size={24} color="#007AFF" />
                        <View style={styles.locationTextContainer}>
                          <Text style={styles.locationName}>{location.name}</Text>
                          <Text style={styles.locationState}>{location.state}</Text>
                        </View>
                      </View>
                      <View style={styles.locationAction}>
                        <Text style={styles.locationTripCount}>{location.count} Trips</Text>
                        <MaterialIcons name="navigate-next" size={24} color="#007AFF" />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </>
        )}
        {/* Pagination Controls - You'll need to implement actual pagination buttons/logic */}
        {/*
        {!isLoading && pagination.hasNext && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
            <Text style={styles.loadMoreButtonText}>Load More</Text>
          </TouchableOpacity>
        )}
        */}
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
  // New styles for location cards
  locationCard: {
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 10,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationState: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTripCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 8,
  },
  // Existing trip card styles (no changes needed for these from your original code)
  tripCard: {
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
  // Styles for pagination "Load More" button (if you uncomment it)
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
