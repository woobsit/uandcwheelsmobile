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
import TopNavBar from '../components/molecules/TopNavBar';
import { AvailableDate } from '../types/bustrip';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, TripDatesScreenRouteProps } from '../types/screenprops';

export default function TripDatesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<TripDatesScreenRouteProps>();

  const {
    departureLocationName,
    departureLocationState,
    arrivalLocationName,
    arrivalLocationState,
  } = route.params;
console.log(route.params);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  const limit = 10;

  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return '';
    return price.toLocaleString();
  };

  const fetchAvailableDates = async (currentPage: number, reset = false) => {
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
      };

      const response = await BusTripService.getAvailableDatesForRoute(params);

      if (reset) {
        setAvailableDates(response.data.items);
      } else {
        setAvailableDates(prev => [...prev, ...response.data.items]);
      }

      setHasNext(response.data.hasNext);
      setPage(response.data.page);
    } catch (err) {
      setError('Failed to load available dates. Please try again.');
      console.error('Error fetching available dates:', err);
    } finally {
      setIsLoading(false);
      setIsPaginating(false);
    }
  };

  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      await fetchAvailableDates(1, true);
    },
  });

  const handleLoadMore = () => {
    if (!isLoading && !isPaginating && hasNext) {
      fetchAvailableDates(page + 1);
    }
  };

  const handleSelectDate = (date: AvailableDate) => {
    navigation.navigate('TripBuses', {
      departureLocationName,
      departureLocationState,
      arrivalLocationName,
      arrivalLocationState,
      departureDate: date.departureDate,
    });
  };

  useEffect(() => {
    fetchAvailableDates(1, true);
  }, [departureLocationName, departureLocationState, arrivalLocationName, arrivalLocationState]);

  const screenTitle = `Dates from ${departureLocationName}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title={screenTitle} />
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
          {isLoading && availableDates.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading available dates...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="error-outline" size={60} color="#FF4444" />
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchAvailableDates(1, true)}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Select Departure Date ({availableDates.length})
              </Text>
              {availableDates.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="calendar-today" size={60} color="#fff" />
                  <Text style={styles.emptyText}>No available dates for this route.</Text>
                  <Text style={styles.emptySubtext}>
                    Please try another route or check back later.
                  </Text>
                </View>
              ) : (
                availableDates.map((date, index) => (
                  <TouchableOpacity
                    key={`${date.departureDate}-${index}`}
                    style={styles.dateCard}
                    onPress={() => handleSelectDate(date)}>
                    <View style={styles.dateInfo}>
                      <MaterialIcons name="event" size={24} color="#0A2540" />
                      <View style={styles.dateTextContainer}>
                        <Text style={styles.dateDisplay}>
                          {formatDate(date.departureDate, 'EEE, MMM d, yyyy')}
                        </Text>
                        <Text style={styles.dateBusCount}>
                          {date.availableBusesCount} bus options
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dateAction}>
                      <Text style={styles.datePriceRange}>
                        ₦{formatPrice(date.minFare)}
                        {date.minFare !== date.maxFare ? ` - ₦${formatPrice(date.maxFare)}` : ''}
                      </Text>
                      <MaterialIcons name="navigate-next" size={24} color="#0A2540" />
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
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateTextContainer: {
    marginLeft: 15,
  },
  dateDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  dateBusCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dateAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePriceRange: {
    fontSize: 16,
    color: '#007AFF',
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