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
import BusTripService from '../requests/busTripService'; // IMPORT THE NEW BUS TRIP SERVICE
import { BusTrip, BusTripFilters } from '../types/bustrip'; // IMPORT BusTrip AND BusTripFilters
import TopNavBar from '../components/molecules/TopNavBar'; // Your existing component
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/screenprops';

// Define a type for a unique location for display
interface UniqueLocation {
  name: string;
  state: string;
  count: number; // Number of trips associated with this location
}

export default function BookTransportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<BusTrip[]>([]); // Use BusTrip type here
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
              departureLocationName: selectedLocation.name, // Use specific filter names
              departureLocationState: selectedLocation.state,
              arrivalLocationName: selectedLocation.name, // Also search as arrival
              arrivalLocationState: selectedLocation.state, // Also search as arrival
            }
          : undefined,
        true, // Pass true to reset pagination on refresh
      );
    },
  });

  // Fetch trips or unique locations from API
  const fetchTrips = async (
    filter?: BusTripFilters, // Use BusTripFilters type
    resetPage = false,
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      let currentPage = resetPage ? 1 : pagination.page;

      const params: BusTripFilters = {
        status: 'scheduled', // Always fetch scheduled trips for user view
        page: currentPage,
        limit: pagination.limit,
        ...filter, // Spread the incoming filter directly
      };
      console.log(params);

      // Call the correct service method
      const response = await BusTripService.getScheduledBusTrips(params); // Use BusTripService
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
      if (trip.trip?.departureLocation?.name && trip.trip?.departureLocation?.state) {
        const key = `${trip.trip.departureLocation.name}_${trip.trip.departureLocation.state}`;
        if (!locationsMap.has(key)) {
          locationsMap.set(key, {
            name: trip.trip.departureLocation.name,
            state: trip.trip.departureLocation.state,
            count: 0, // Will count later
          });
        }
        locationsMap.get(key)!.count++;
      }

      // Handle arrival location
      if (trip.trip?.arrivalLocation?.name && trip.trip?.arrivalLocation?.state) {
        const key = `${trip.trip.arrivalLocation.name}_${trip.trip.arrivalLocation.state}`;
        if (!locationsMap.has(key)) {
          locationsMap.set(key, {
            name: trip.trip.arrivalLocation.name,
            state: trip.trip.arrivalLocation.state,
            count: 0, // Will count later
          });
        }
        locationsMap.get(key)!.count++;
      }
    });

    // Filter by search term on the STATE name
    const term = searchTerm.toLowerCase();
    const filtered = Array.from(locationsMap.values()).filter(
      location =>
        location.state.toLowerCase().includes(term) || location.name.toLowerCase().includes(term), // Also allow searching by location name
    );

    // Sort by location name
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [trips, searchTerm]); // Re-calculate when trips or searchTerm changes

  // Filter trips based on search term when a location IS selected
  const filteredTrips = useMemo(() => {
    if (!selectedLocation) {
      return []; // Should not be called if no location is selected
    }
    const term = searchTerm.toLowerCase();
    // The 'trips' array will already contain only trips relevant to `selectedLocation`
    // due to the `fetchTrips` call. So, we just filter by the search term on location names.
    return trips.filter(
      trip =>
        trip.trip?.departureLocation?.name?.toLowerCase().includes(term) ||
        trip.trip?.arrivalLocation?.name?.toLowerCase().includes(term) ||
        trip.trip?.departureLocation?.state?.toLowerCase().includes(term) ||
        trip.trip?.arrivalLocation?.state?.toLowerCase().includes(term),
    );
  }, [trips, searchTerm, selectedLocation]);

  // Handle selecting a location to view its trips
  const handleSelectLocation = (location: UniqueLocation) => {
    setSelectedLocation(location);
    setSearchTerm(''); // Clear search term when selecting a location
    // Reset pagination and fetch trips for this specific location
    fetchTrips(
      {
        departureLocationName: location.name,
        departureLocationState: location.state,
        arrivalLocationName: location.name,
        arrivalLocationState: location.state,
      },
      true, // Reset page to 1
    );
  };

  // Go back from trip list to location list
  const handleBackToLocations = () => {
    setSelectedLocation(null);
    setSearchTerm(''); // Clear search when going back
    fetchTrips(undefined, true); // Re-fetch initial unique locations (all trips)
  };

  const handleBookTrip = (trip: BusTrip) => {
    // Navigate to the booking details screen, passing the trip ID or full trip object
    navigation.navigate('TripDetails', { tripId: trip.id }); // Assuming you have a TripDetails screen
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchTrips();
  }, []); // Empty dependency array means this runs once on mount

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
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              selectedLocation ? 'Search within trips...' : 'Search by state or city name...'
            }
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
                        departureLocationName: selectedLocation.name,
                        departureLocationState: selectedLocation.state,
                        arrivalLocationName: selectedLocation.name,
                        arrivalLocationState: selectedLocation.state,
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
                          {trip.trip?.departureLocation?.name} → {trip.trip?.arrivalLocation?.name}
                        </Text>
                        <Text style={styles.tripPrice}>₦{trip.trip?.fare?.toLocaleString()}</Text>
                      </View>

                      <View style={styles.tripDetails}>
                        <View style={styles.detailItem}>
                          <MaterialIcons name="schedule" size={18} color="#666" />
                          <Text style={styles.detailText}>
                            {formatDate(trip.departure_time as string, 'hh:mm a')} -{' '}
                            {formatDate(trip.trip?.estimated_arrival as string, 'hh:mm a')}
                          </Text>
                        </View>

                        <View style={styles.detailItem}>
                          <MaterialIcons name="event" size={18} color="#666" />
                          <Text style={styles.detailText}>
                            {formatDate(trip.departure_time as string, 'MMM d, yyyy')}
                          </Text>
                        </View>

                        <View style={styles.detailItem}>
                          <MaterialIcons name="directions-bus" size={18} color="#666" />
                          <Text style={styles.detailText}>
                            {trip.bus?.brand || 'Standard Bus'} • {trip.bus?.capacity || 'Unknown'}{' '}
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
                              : trip.status === 'boarding'
                                ? styles.statusOngoing // Using ongoing for boarding visually
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
