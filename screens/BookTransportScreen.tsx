import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';

interface UniqueTripRoute {
  departureLocationName: string;
  departureLocationState: string;
  arrivalLocationName: string;
  arrivalLocationState: string;
  minFare: number;
  maxFare: number;
  availableDatesCount: number;
}

export default function BookTransportScreen() {
  const navigation = useNavigation<BookTransportScreenProps['navigation']>();

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [tripRoutes, setTripRoutes] = useState<UniqueTripRoute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  const limit = 10;

  const handleSelectRoute = (route: UniqueTripRoute) => {
    navigation.navigate('TripDates', {
      departureLocationName: route.departureLocationName,
      departureLocationState: route.departureLocationState,
      arrivalLocationName: route.arrivalLocationName,
      arrivalLocationState: route.arrivalLocationState,
    });
  };

  const fetchTripRoutes = async (currentPage: number, reset = false) => {
    if (isPaginating && !reset) return;
    if (!hasNext && !reset) return;

    try {
      if (reset) {
        setIsLoading(true);
        setPage(1);
      } else {
        setIsPaginating(true);
      }
      setError(null);

      const response = await BusTripService.getAllAvailableTrips({
        page: currentPage,
        limit: limit,
      });

      if (reset) {
        setTripRoutes(response.data.items);
      } else {
        setTripRoutes(prev => [...prev, ...response.data.items]);
      }

      setHasNext(response.data.hasNext);
      setPage(response.data.page);
    } catch (err) {
      setError('Failed to load available trip routes. Please try again.');
      console.error('Error fetching trip routes:', err);
    } finally {
      setIsLoading(false);
      setIsPaginating(false);
    }
  };

  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchTripRoutes(1, true);
    },
  });

  const handleLoadMore = () => {
    if (!isLoading && !isPaginating && hasNext) {
      fetchTripRoutes(page + 1);
    }
  };

  const filteredRoutes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tripRoutes.filter(
      route =>
        route.departureLocationName.toLowerCase().includes(term) ||
        route.departureLocationState.toLowerCase().includes(term) ||
        route.arrivalLocationName.toLowerCase().includes(term) ||
        route.arrivalLocationState.toLowerCase().includes(term),
    ).sort((a, b) => a.departureLocationName.localeCompare(b.departureLocationName));
  }, [tripRoutes, searchTerm]);

  useEffect(() => {
    fetchTripRoutes(1, true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title={'Book Transport'} />
      <View style={styles.contentWrapper}>
        <View style={styles.searchCard}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={'Search by city or state...'}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              titleColor="#fff"
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
            if (isCloseToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {isLoading && tripRoutes.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading available trip routes...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="error-outline" size={60} color="#ff4444" />
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
                  <MaterialIcons name="route" size={60} color="#fff" />
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
                    onPress={() => handleSelectRoute(route)}>
                    <View style={styles.routeHeader}>
                      <View style={styles.routeTextContainer}>
                        <Text style={styles.routeLocationText}>
                          {route.departureLocationName}
                        </Text>
                        <MaterialIcons
                          name="arrow-forward"
                          size={24}
                          color="#0A2540"
                          style={styles.arrowIcon}
                        />
                        <Text style={styles.routeLocationText}>
                          {route.arrivalLocationName}
                        </Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.routePriceRange}>
                          ₦{route.minFare?.toLocaleString()}
                        </Text>
                        {route.minFare !== route.maxFare && (
                          <Text style={styles.routePriceRangeSub}>
                            - ₦{route.maxFare?.toLocaleString()}
                          </Text>
                        )}
                      </View>
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
                      onPress={() => handleSelectRoute(route)}>
                      <Text style={styles.viewTripsButtonText}>View Dates</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
              {isPaginating && hasNext && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginTop: 20 }} />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A2540',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 15,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#0A2540',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    flexWrap: 'wrap',
  },
  routeLocationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  arrowIcon: {
    marginHorizontal: 10,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  routePriceRange: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  routePriceRangeSub: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
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
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
    color: '#fff',
    textAlign: 'center',
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
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});