import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';

export default function CustomDrawerContent({ navigation }: any) {
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);
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

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.dispatch(DrawerActions.closeDrawer())}
      >
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Logistics App</Text>
      </View>

      {/* Main Menu Items */}
      <DrawerItem
        label="Dashboard"
        icon={({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />}
        onPress={() => navigation.navigate('LogisticsHome')}
      />

      {/* Delivery Section - Expandable */}
      <TouchableOpacity style={[styles.sectionHeader, styles.parentItem]} onPress={toggleDelivery}>
        <MaterialIcons name="local-shipping" size={24} color="#333" style={styles.icon} />
        <Text style={styles.label}>Delivery</Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <MaterialIcons name="expand-more" size={24} color="#333" />
        </Animated.View>
      </TouchableOpacity>

      {deliveryExpanded && (
        <View style={styles.subItemsContainer}>
          <DrawerItem
            label="New Delivery"
            icon={({ color, size }) => (
              <View style={styles.subItemIconContainer}>
                <MaterialIcons
                  name="add-circle-outline"
                  size={size}
                  color={color}
                  style={styles.drawerIcon}
                />
              </View>
            )}
            onPress={() => navigation.navigate('NewDelivery')}
            style={styles.subItem}
            labelStyle={styles.subItemLabel}
          />
          <DrawerItem
            label="View Deliveries"
            icon={({ color, size }) => (
              <View style={styles.subItemIconContainer}>
                <MaterialIcons
                  name="list-alt"
                  size={size}
                  color={color}
                  style={styles.drawerIcon}
                />
              </View>
            )}
            onPress={() => navigation.navigate('ViewDeliveries')}
            style={styles.subItem}
            labelStyle={styles.subItemLabel}
          />
          <DrawerItem
            label="Delivery History"
            icon={({ color, size }) => (
              <View style={styles.subItemIconContainer}>
                <MaterialIcons name="history" size={size} color={color} style={styles.drawerIcon} />
              </View>
            )}
            onPress={() => navigation.navigate('DeliveryHistory')}
            style={styles.subItem}
            labelStyle={styles.subItemLabel}
          />
          <DrawerItem
            label="Track Package"
            icon={({ color, size }) => (
              <View style={styles.subItemIconContainer}>
                <MaterialIcons
                  name="gps-fixed"
                  size={size}
                  color={color}
                  style={styles.drawerIcon}
                />
              </View>
            )}
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
      />

      <DrawerItem
        label="Vehicles"
        icon={({ color, size }) => (
          <MaterialIcons name="directions-car" size={size} color={color} />
        )}
        onPress={() => navigation.navigate('Vehicles')}
      />

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
          <MaterialIcons name="logout" size={20} color="#ff4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 15,
    alignSelf: 'flex-end',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  icon: {
    marginRight: 32,
    width: 24,
    textAlign: 'center',
  },
  drawerIcon: { marginRight: 12 },
  label: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.87)',
    flex: 1,
  },
  sectionHeader: {
    justifyContent: 'space-between',
  },
  subItemsContainer: {
    marginLeft: 24,
    paddingLeft: 24,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  subItemIconContainer: {
    marginRight: 8, // Additional spacing for sub-item icons
  },

  subItem: {
    height: 60,
    marginVertical: 4,
  },

  subItemLabel: {
    fontSize: 14,
    marginLeft: -16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: 10,
    color: '#ff4444',
    fontWeight: 'bold',
  },
});
