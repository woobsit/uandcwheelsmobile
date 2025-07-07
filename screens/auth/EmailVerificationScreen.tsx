// src/screens/auth/VerificationScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AuthService } from '../../requests';
import { showApiErrorAlert } from '../../utils/apiHelpers';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/screenprops';

// Resend timer in seconds
const RESEND_TIMEOUT = 60;

export default function VerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const tokenInputRef = useRef<TextInput>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load email from navigation params
  useEffect(() => {
    // In a real app, you might get this from navigation params or async storage
    const userEmail = 'user@example.com'; // Replace with actual email
    setEmail(userEmail);
    
    // Handle deep linking for verification
    const handleDeepLink = (event: { url: string }) => {
      const url = new URL(event.url);
      const tokenParam = url.searchParams.get('token');
      if (tokenParam) {
        setToken(tokenParam);
        handleVerify(tokenParam);
      }
    };

    // Listen for deep links
    Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        const parsedUrl = new URL(url);
        const tokenParam = parsedUrl.searchParams.get('token');
        if (tokenParam) {
          setToken(tokenParam);
          handleVerify(tokenParam);
        }
      }
    });

    // Start resend countdown
    startCountdown();

    return () => {
      Linking.removeAllListeners('url');
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = () => {
    setResendDisabled(true);
    setCountdown(RESEND_TIMEOUT);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (verificationToken?: string) => {
    const verifyToken = verificationToken || token;
    if (!verifyToken) {
      Alert.alert('Error', 'Please enter your verification code');
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.verifyEmail(verifyToken);
      
      Alert.alert(
        'Email Verified!',
        'Your email has been successfully verified. You can now log in to your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      showApiErrorAlert(error, 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      await AuthService.resendVerification(email);
      startCountdown();
      Alert.alert('Email Sent', 'A new verification email has been sent to your email address.');
    } catch (error) {
      showApiErrorAlert(error, 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Feather name="mail" size={64} color="#4A90E2" />
            </View>
            
            <Text style={styles.title}>Verify Your Email</Text>
            
            <Text style={styles.subtitle}>
              We've sent a verification code to:
            </Text>
            
            <Text style={styles.emailText}>{email}</Text>
            
            <Text style={styles.instructions}>
              Please enter the 6-digit code from your email below
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                ref={tokenInputRef}
                style={styles.input}
                placeholder="Enter verification code"
                placeholderTextColor="#999"
                value={token}
                onChangeText={setToken}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={!token}
                editable={!isLoading}
                onSubmitEditing={() => handleVerify()}
              />
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => tokenInputRef.current?.focus()}
              >
                <Feather name="edit" size={20} color="#4A90E2" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.disabledButton]}
              onPress={() => handleVerify()}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Email</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the email? 
              </Text>
              
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendDisabled || isLoading}
              >
                <Text style={[
                  styles.resendLink,
                  (resendDisabled || isLoading) && styles.disabledResend
                ]}>
                  Resend {resendDisabled ? `(${countdown}s)` : ''}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Feather name="arrow-left" size={20} color="#4A90E2" />
              <Text style={styles.backText}>Back to Registration</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#E8F2FF',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  scanButton: {
    position: 'absolute',
    right: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#A0C4FF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  resendLink: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  disabledResend: {
    color: '#999',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 5,
  },
});