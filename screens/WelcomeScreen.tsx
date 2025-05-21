import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated';
import type {WelcomeScreenProps} from '../types/AuthProps'

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  // Animation values
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const position = useSharedValue(50);

  // Logo animation
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: position.value }
    ],
    opacity: opacity.value
  }));

  // Background pulse effect
  const bgScale = useSharedValue(1);
  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }]
  }));

  useEffect(() => {
    // Entry animation sequence
    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 800 });
    position.value = withSpring(0, { damping: 15 });
    
    // Background pulse
    bgScale.value = withTiming(1.2, {
      duration: 1500,
      easing: Easing.out(Easing.ease)
    });

    // Navigate after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <Animated.View style={[styles.background, bgStyle]} />

      {/* Animated Logo */}
      <Animated.View style={[logoStyle]}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
        />
      </Animated.View>

<ActivityIndicator 
  size="large" 
  color="#FFFFFF" 
  style={styles.loader} 
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    overflow: 'hidden'
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    zIndex: 2
  },

   loader: {
    marginTop: 20,
    zIndex: 3
  }
});