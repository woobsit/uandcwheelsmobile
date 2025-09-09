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
import { AuthStackParamList, TripDatesScreenRouteProps, } from '../types/screenprops';


export default function TripDatesScreen() {

  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<TripDatesScreenRouteProps>();
  

  const {
    departureLocationName,
    departureLocationState,
    arrivalLocationName,
    arrivalLocationState,
  } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  // Set a reasonable limit for this screen
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

  const screenTitle = `${departureLocationName} to ${arrivalLocationName}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopNavBar title={screenTitle} />
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
        scrollEventThrottle={400}>
        {isLoading && availableDates.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading available dates...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
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
                <MaterialIcons name="calendar-today" size={60} color="#ddd" />
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
                    <MaterialIcons name="event" size={24} color="#007AFF" />
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
                    <MaterialIcons name="navigate-next" size={24} color="#007AFF" />
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
  // ... (Your styles remain unchanged)
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