// screens/BookTransportScreen.tsx
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
import useRefreshControl from '../hooks/useRefreshControl';
import BusTripService from '../requests/busTripService';
import TopNavBar from '../components/molecules/TopNavBar';
import { BookTransportScreenProps } from '../types/screenprops';

interface UniqueTripRoute {
  departureLocationName: string;
  departureLocationState: string;
  arrivalLocationName: string;
  arrivalLocationState: string;
  minFare: number;
  maxFare: number;
  availableDatesCount: number;
}

export default function BookTransportScreen({ navigation }: BookTransportScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tripRoutes, setTripRoutes] = useState<UniqueTripRoute[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New state for pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasNext, setHasNext] = useState(true);

  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      setPage(1); // Reset page on refresh
      await fetchTripRoutes(1, limit, true);
    },
  });

  // Updated fetch function to handle pagination and append data
  const fetchTripRoutes = async (currentPage = 1, currentLimit = limit, reset = false) => {
    
    if (!hasNext && !reset) return; // Prevent unnecessary fetches if we're at the end
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await BusTripService.getAllAvailableTrips({
        page: currentPage,
        limit: currentLimit
      });
      console.log(response)
      if (reset) {
        setTripRoutes(response.data.items);
      } else {
        setTripRoutes(prev => [...prev, ...response.data.items]);
      }

      setHasNext(response.data.hasNext);
      setPage(currentPage); // Update the page state after a successful fetch
      
    } catch (err) {
      setError('Failed to load available trip routes. Please try again.');
      console.error('Error fetching trip routes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasNext && !isLoading) {
      fetchTripRoutes(page + 1);
    }
  };

  const filteredRoutes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!tripRoutes || tripRoutes.length === 0) return [];

    const filtered = tripRoutes.filter(
      route =>
        route.departureLocationName.toLowerCase().includes(term) ||
        route.departureLocationState.toLowerCase().includes(term) ||
        route.arrivalLocationName.toLowerCase().includes(term) ||
        route.arrivalLocationState.toLowerCase().includes(term),
    );

    filtered.sort((a, b) => {
      const depCompare = a.departureLocationName.localeCompare(b.departureLocationName);
      if (depCompare !== 0) return depCompare;
      return a.arrivalLocationName.localeCompare(b.arrivalLocationName);
    });
    return filtered;
  }, [tripRoutes, searchTerm]);

  const handleSelectRoute = (route: UniqueTripRoute) => {
    navigation.navigate('TripDates', {
      departureLocationName: route.departureLocationName,
      departureLocationState: route.departureLocationState,
      arrivalLocationName: route.arrivalLocationName,
      arrivalLocationState: route.arrivalLocationState,
    });
  };

  useEffect(() => {
    fetchTripRoutes(1, limit, true);
  }, []); // Initial fetch on component mount

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title={'Book Transport'} />
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
          onScroll={({ nativeEvent }) => {
            // Lazy loading logic
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400} // Adjust as needed for performance
        >
          {/* Search Bar and other JSX */}
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
          
          {isLoading && filteredRoutes.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading available trip routes...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Available Trip Routes ({filteredRoutes.length})
              </Text>
              {filteredRoutes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="route" size={60} color="#ddd" />
                  <Text style={styles.emptyText}>No trip routes found.</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search criteria or refresh.
                  </Text>
                </View>
              ) : (
                filteredRoutes.map((route, index) => (
                  <TouchableOpacity
                    key={`${route.departureLocationName}-${route.arrivalLocationName}-${index}`}
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
              {/* Indicator for lazy loading */}
              {isLoading && hasNext && (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 20 }} />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
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
  // Removed unnecessary loadMoreButton styles as infinite scrolling is no longer needed
});