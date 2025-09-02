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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import useRefreshControl from '../hooks/useRefreshControl';
import { formatTime, formatDate } from '../utils/dateHelpers';
import BusTripService from '../requests/busTripService';
import { TripBusesScreenProps } from '../types/screenprops';
import TopNavBar from '../components/molecules/TopNavBar';
import { AvailableBus } from '../types/bustrip';

export default function TripBusesScreen({ navigation, route }: TripBusesScreenProps) {
  const {
    departureLocationName,
    departureLocationState,
    arrivalLocationName,
    arrivalLocationState,
    departureDate,
  } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [availableBuses, setAvailableBuses] = useState<AvailableBus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  // Set a reasonable limit for this screen
  const limit = 10;

  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return '';
    return price.toLocaleString();
  };

  const fetchAvailableBuses = async (currentPage: number, reset = false) => {
    if (isPaginating && !reset) return;
    if (!hasNext && !reset) return;

    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsPaginating(true);
      }
      setError(null);

      const params = {
        page: currentPage,
        limit,
        departureLocationName,
        departureLocationState,
        arrivalLocationName,
        arrivalLocationState,
        departureDate,
      };

      // Ensure this service call matches your backend controller name
      const response = await BusTripService.getAvailableBusesForDate(params);
      if (reset) {
        setAvailableBuses(response.data.items);
      } else {
        setAvailableBuses(prev => [...prev, ...response.data.items]);
      }

      setHasNext(response.data.hasNext);
      setPage(response.data.page);
    } catch (err) {
      setError('Failed to load available buses. Please try again.');
      console.error('Error fetching available buses:', err);
    } finally {
      setIsLoading(false);
      setIsPaginating(false);
    }
  };

  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchAvailableBuses(1, true);
    },
  });

  const handleLoadMore = () => {
    if (!isLoading && !isPaginating && hasNext) {
      fetchAvailableBuses(page + 1);
    }
  };

  const handleSelectBus = (busTripId: string) => {
    // Navigate to the next screen, likely for seat selection or booking, passing the bus trip ID
  //  navigation.navigate('SeatSelection', {
  //    busTripId,
//departureLocationName,
   //   arrivalLocationName,
  //    departureDate,
  //  });
  };

  useEffect(() => {
    fetchAvailableBuses(1, true);
  }, [departureDate, departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState]);

  const screenTitle = `${departureLocationName} to ${arrivalLocationName}`;
  const subtitle = `${formatDate(departureDate, 'EEE, MMM d, yyyy')}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title={screenTitle} subtitle={subtitle} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
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
        {isLoading && availableBuses.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading bus options...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchAvailableBuses(1, true)}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Available Buses ({availableBuses.length})
            </Text>
            {availableBuses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bus" size={60} color="#ddd" />
                <Text style={styles.emptyText}>No available buses for this date.</Text>
                <Text style={styles.emptySubtext}>
                  Please try another date or check back later.
                </Text>
              </View>
            ) : (
              availableBuses.map((bus, index) => (
                <TouchableOpacity
                  key={bus.id}
                  style={styles.busCard}
                  onPress={() => handleSelectBus(bus.id)}
                >
                  <View style={styles.busInfo}>
                    <MaterialCommunityIcons name="bus-side" size={30} color="#007AFF" />
                    <View style={styles.busTextContainer}>
                      <Text style={styles.busBrand}>
                        {bus.bus_details.brand} ({bus.bus_details.plate_number})
                      </Text>
                      <Text style={styles.busDepartureTime}>
                        Departure: **{formatTime(bus.departure_time)}**
                      </Text>
                      <Text style={styles.busDetails}>
                        Capacity: {bus.bus_details.capacity} seats | Available: {bus.available_seats}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.busAction}>
                    <Text style={styles.busFare}>₦{formatPrice(bus.fare)}</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#007AFF" />
                  </View>
                </TouchableOpacity>
              ))
            )}
            {isPaginating && hasNext && (
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
  busCard: {
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
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busTextContainer: {
    marginLeft: 10,
    flexShrink: 1,
  },
  busBrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  busDepartureTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  busDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  busAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busFare: {
    fontSize: 15,
    color: '#444',
    fontWeight: 'bold',
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