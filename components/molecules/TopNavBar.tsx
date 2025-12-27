import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/screenprops';
import { useAuth } from '../../hooks/useAuth'; // 🚀 Import your auth hook

export default function TopNavBar({ title }: { title: string; subtitle?: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { isLoggedIn } = useAuth(); // 🚀 Get the login status

const handleLeftIconPress = () => {
    if (isLoggedIn) {
      // If logged in, open the sidebar
      navigation.dispatch(DrawerActions.toggleDrawer());
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleLeftIconPress}
      >
        <MaterialIcons 
          name={isLoggedIn ? "menu" : "arrow-back"} 
          size={24} 
          color="#fff" 
        />
      </TouchableOpacity>

      <Text style={styles.screenTitle}>{title}</Text>

      <View style={styles.iconsRight}>
        {/* Only show notifications and settings if logged in */}
        {isLoggedIn && (
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <MaterialIcons name="notifications" size={24} color="#fff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { marginLeft: 15 }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <MaterialIcons name="settings" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}
        
        {/* Optional: Spacer for Guests if you want the title centered */}
        {!isLoggedIn && <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#0A2540', // Deep blue brand color
    elevation: 4, // Add a shadow for depth on Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', // White text for strong contrast
  },
  iconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF4444', // Vibrant red
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});