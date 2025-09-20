// src/screens/auth/ResetPasswordScreen.tsx
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, EmailResetScreenRouteProp } from '../../types/screenprops';
import CustomAlertModal from '../../components/organisms/CustomAlertModal';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<EmailResetScreenRouteProp>();
  const email = route.params?.email || '';

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState(''); // State to hold form validation errors

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: '',
    message: '',
    icon: 'info',
  });
  
  const showAlert = (title: string, message: string, icon: 'success' | 'error' | 'info' = 'info') => {
    setModalProps({ title, message, icon });
    setIsModalVisible(true);
  };
  
  const handleModalPress = () => {
    setIsModalVisible(false);
    if (modalProps.icon === 'success') {
      navigation.navigate('Login');
    }
  };

  const handleSubmit = async () => {
    setValidationError(''); // Clear previous validation errors

    // 1. Validate the reset code
    if (!code || code.length !== 6) {
      setValidationError('Please enter a valid 6-digit code.');
      return;
    }

    // 2. Validate the new password
    if (!password) {
      setValidationError('New password is required.');
      return;
    }
    if (password.length < 6) {
      setValidationError('New password must be at least 6 characters.');
      return;
    }

    // 3. Validate that the passwords match
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.resetPassword(email, code, password);

      showAlert('Success', 'Your password has been reset successfully.', 'success');
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to reset password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the code sent to your email to reset your password.</Text>

          <View style={styles.emailDisplayContainer}>
            <Feather name="mail" size={16} color="#007AFF" />
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="key" size={20} color="#007AFF" style={styles.icon} />
            <TextInput
              style={styles.inputField}
              placeholder="Reset code"
              placeholderTextColor="#888"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setValidationError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="lock" size={20} color="#007AFF" style={styles.icon} />
            <TextInput
              style={styles.inputField}
              placeholder="New password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setValidationError('');
              }}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="lock" size={20} color="#007AFF" style={styles.icon} />
            <TextInput
              style={styles.inputField}
              placeholder="Confirm password"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setValidationError('');
              }}
              secureTextEntry
              editable={!isLoading}
            />
          </View>
          
          {/* Display validation error here */}
          <View style={styles.errorTextContainer}>
            {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backText}>Back to Forgot Password</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    marginBottom: 5,
    textAlign: 'center',
    color: '#0A2540',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  emailDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
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
    marginTop: 10,
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
  errorTextContainer: {
    height: 30, // Reserve space to prevent layout shifting
    marginBottom: 10,
  },
  errorText: {
    color: '#FF6347',
    fontSize: 12,
    textAlign: 'center',
  },
});