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
import { AuthStackParamList, TripBusesScreenRouteProps } from '../types/screenprops';
import TopNavBar from '../components/molecules/TopNavBar';
import { AvailableBus } from '../types/bustrip';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function TripBusesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<TripBusesScreenRouteProps>();

  const {
    departureLocationName,
    departureLocationState,
    arrivalLocationName,
    arrivalLocationState,
    departureDate,
  } = route.params;
console.log(route.params);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [availableBuses, setAvailableBuses] = useState<AvailableBus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

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

  const handleSelectBus = (busTripId: number) => {
    navigation.navigate('PassengerDetailsAndSeatSelection', {
      busTripId,
    });
  };

  useEffect(() => {
    fetchAvailableBuses(1, true);
  }, [departureDate, departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState]);

  const screenTitle = `${departureLocationName} to ${arrivalLocationName}`;
  const subtitle = `${formatDate(departureDate, 'EEE, MMM d, yyyy')}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title={screenTitle} subtitle={subtitle} />
      <View style={styles.contentWrapper}>
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
          {isLoading && availableBuses.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading bus options...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="error-outline" size={60} color="#FF4444" />
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
                  <MaterialCommunityIcons name="bus" size={60} color="#fff" />
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
                      <MaterialCommunityIcons name="bus-side" size={30} color="#0A2540" />
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  busCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busTextContainer: {
    marginLeft: 15,
    flexShrink: 1,
  },
  busBrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  busDepartureTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  busDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  busAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busFare: {
    fontSize: 18,
    color: '#0A2540',
    fontWeight: 'bold',
    marginRight: 10,
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