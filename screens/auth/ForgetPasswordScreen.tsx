// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { AuthService } from '../../requests';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/screenprops';
import { matchEmail } from '../../utils/pregmatch';
import CustomAlertModal from '../../components/organisms/CustomAlertModal'; // Import your custom modal

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // New state variables for the custom alert modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: '',
    message: '',
    icon: 'info',
  });
  
  // New state to handle the post-alert navigation
const [alertNavigation, setAlertNavigation] = useState<(() => void) | null>(null);
  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!matchEmail(email)) {
      setError('Invalid email format');
      return false;
    }
    setError('');
    return true;
  };
  
  // Function to show the custom alert
const showAlert = (title: string, message: string, icon: 'success' | 'error' | 'info' = 'info', navAction: (() => void) | null = null) => {
  setModalProps({ title, message, icon });
  setIsModalVisible(true);
  setAlertNavigation(() => navAction);
};
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.forgotPassword(email);

      // Use your custom alert for success messages
      showAlert(
        'Code Sent',
        'A password reset code has been sent to your email.',
        'success',
        () => navigation.navigate('ResetPassword', { email })
      );

    } catch (error: any) {
      // Use your custom alert for error messages
      showAlert('Error', error.message || 'Failed to send reset code', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to hide the custom alert and execute navigation
  const handleModalPress = () => {
    setIsModalVisible(false);
    if (alertNavigation) {
      alertNavigation();
    }
    setAlertNavigation(null); // Clear the stored action
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset code.</Text>

          <View style={styles.inputWrapper}>
            <Feather name="mail" size={20} color="#007AFF" style={styles.icon} />
            <TextInput
              style={styles.inputField}
              placeholder="Email address"
              placeholderTextColor="#888"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.errorTextContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Render the CustomAlertModal here */}
      <CustomAlertModal
        isVisible={isModalVisible}
        title={modalProps.title}
        message={modalProps.message}
        onPress={handleModalPress}
        icon={modalProps.icon as 'success' | 'error' | 'info'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A2540',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#0A2540',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#95b7ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6347',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  errorTextContainer: {
    height: 30,
    marginBottom: 10,
  },
});