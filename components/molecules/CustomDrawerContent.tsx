import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';

export default function CustomDrawerContent({ navigation }: any) {
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);
  const [transportExpanded, setTransportExpanded] = useState(false);
  const rotateAnim = useState(new Animated.Value(0))[0];

  const toggleDelivery = () => {
    Animated.timing(rotateAnim, {
      toValue: deliveryExpanded ? 0 : 1,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    setDeliveryExpanded(!deliveryExpanded);
  };

  const toggleTransport = () => {
    Animated.timing(rotateAnim, {
      toValue: transportExpanded ? 0 : 1,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    setTransportExpanded(!transportExpanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.outerContainer}>
      <View style={styles.drawerHeader}>
        {/* Close Button on the header itself */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.dispatch(DrawerActions.closeDrawer())}
        >
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Image
          source={require('../../assets/logo.png')} // Replace with your logo
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>UandC Wheels</Text>
      </View>

      <DrawerContentScrollView contentContainerStyle={styles.container}>
        {/* Main Menu Items */}
        <DrawerItem
          label="Dashboard"
          labelStyle={styles.drawerLabel}
          icon={({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />}
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.drawerItem}
        />

        {/* Transport Section - Expandable */}
        <TouchableOpacity style={[styles.sectionHeader, styles.drawerItem]} onPress={toggleTransport}>
          <View style={styles.labelContainer}>
            <MaterialIcons name="local-shipping" size={24} color="#0A2540" style={styles.icon} />
            <Text style={styles.label}>Transport</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <MaterialIcons name="expand-more" size={24} color="#0A2540" />
          </Animated.View>
        </TouchableOpacity>

        {transportExpanded && (
          <View style={styles.subItemsContainer}>
            <DrawerItem
              label="Book Transport"
              icon={({ color, size }) => <MaterialIcons name="add-circle-outline" size={size} color={color} />}
              onPress={() => navigation.navigate('NewDelivery')}
              style={styles.subItem}
              labelStyle={styles.subItemLabel}
            />
            <DrawerItem
              label="View My Bookings"
              icon={({ color, size }) => <MaterialIcons name="list-alt" size={size} color={color} />}
              onPress={() => navigation.navigate('ViewDeliveries')}
              style={styles.subItem}
              labelStyle={styles.subItemLabel}
            />
          </View>
        )}

        {/* Delivery Section - Expandable */}
        <TouchableOpacity style={[styles.sectionHeader, styles.drawerItem]} onPress={toggleDelivery}>
          <View style={styles.labelContainer}>
            <MaterialIcons name="motorcycle" size={24} color="#0A2540" style={styles.icon} />
            <Text style={styles.label}>Delivery</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <MaterialIcons name="expand-more" size={24} color="#0A2540" />
          </Animated.View>
        </TouchableOpacity>

        {deliveryExpanded && (
          <View style={styles.subItemsContainer}>
            <DrawerItem
              label="New Delivery"
              icon={({ color, size }) => <MaterialIcons name="add-circle-outline" size={size} color={color} />}
              onPress={() => navigation.navigate('NewDelivery')}
              style={styles.subItem}
              labelStyle={styles.subItemLabel}
            />
            <DrawerItem
              label="View Deliveries"
              icon={({ color, size }) => <MaterialIcons name="list-alt" size={size} color={color} />}
              onPress={() => navigation.navigate('ViewDeliveries')}
              style={styles.subItem}
              labelStyle={styles.subItemLabel}
            />
            <DrawerItem
              label="Delivery History"
              icon={({ color, size }) => <MaterialIcons name="history" size={size} color={color} />}
              onPress={() => navigation.navigate('DeliveryHistory')}
              style={styles.subItem}
              labelStyle={styles.subItemLabel}
            />
            <DrawerItem
              label="Track Package"
              icon={({ color, size }) => <MaterialIcons name="gps-fixed" size={size} color={color} />}
              onPress={() => navigation.navigate('TrackPackage')}
              style={styles.subItem}
              labelStyle={styles.subItemLabel}
            />
          </View>
        )}

        {/* Other Menu Items */}
        <DrawerItem
          label="Drivers"
          icon={({ color, size }) => <MaterialIcons name="people" size={size} color={color} />}
          onPress={() => navigation.navigate('Drivers')}
          style={styles.drawerItem}
          labelStyle={styles.drawerLabel}
        />

        <DrawerItem
          label="Vehicles"
          icon={({ color, size }) => <MaterialIcons name="directions-car" size={size} color={color} />}
          onPress={() => navigation.navigate('Vehicles')}
          style={styles.drawerItem}
          labelStyle={styles.drawerLabel}
        />
      </DrawerContentScrollView>

      {/* Footer with Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            navigation.dispatch(DrawerActions.closeDrawer());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    backgroundColor: '#0A2540',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 10,
  },
  container: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  drawerItem: {
    backgroundColor: '#F0F2F5',
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  drawerLabel: {
    color: '#0A2540',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 15,
    width: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#0A2540',
    fontWeight: 'bold',
  },
  subItemsContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: -5,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subItem: {
    height: 50,
  },
  subItemLabel: {
    fontSize: 14,
    marginLeft: -10,
    color: '#666',
  },
  footer: {
    backgroundColor: '#0A2540',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  logoutText: {
    marginLeft: 10,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});