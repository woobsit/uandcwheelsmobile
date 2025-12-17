import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalStyles from '../../assets/styles/globalStyles';
import Feather from 'react-native-vector-icons/Feather';
import useRefreshControl from '../../hooks/useRefreshControl';
import { matchEmail } from '../../utils/pregmatch';
import { AuthService } from '../../requests';
import { RegisterScreenProps } from '../../types/screenprops';
import CustomAlertModal from '../../components/organisms/CustomAlertModal'; // <-- ADDED

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // New state variables for the custom alert modal
  const [isModalVisible, setIsModalVisible] = useState(false); // <-- ADDED
  const [modalProps, setModalProps] = useState({ // <-- ADDED
    title: '',
    message: '',
    icon: 'info',
  });
  const [alertNavigation, setAlertNavigation] = useState<(() => void) | null>(null); // <-- ADDED

  // Function to reset the form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  // Create refresh control logic
  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      resetForm();
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    },
  });

  // Function to show the custom alert
  const showAlert = (title: string, message: string, icon: 'success' | 'error' | 'info' = 'info', navAction: (() => void) | null = null) => { // <-- ADDED
    setModalProps({ title, message, icon });
    setIsModalVisible(true);
    setAlertNavigation(() => navAction);
  };
  
  // Function to hide the custom alert and execute a navigation action
  const handleModalPress = () => { // <-- ADDED
    setIsModalVisible(false);
    if (alertNavigation) {
      alertNavigation();
    }
    setAlertNavigation(null);
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
      valid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Full name must be at least 3 characters';
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!matchEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

 const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
        setIsLoading(true);

        const response = await AuthService.register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
        });

        // Deconstruct the response data to get the message and status
        const { status, message } = response.data;

        // Use the API response message as the single source of truth
        if (status === 201) {
            showAlert(
                'Success',
                message, // <-- Use the API message directly
                'success',
                () => navigation.navigate('EmailVerification', { email: formData.email })
            );
        } else if (status === 409) {
            setErrors(prev => ({
                ...prev,
                email: message, // <-- Use the API message directly for the email error
            }));
            showAlert('Error', message, 'error'); // <-- Use the API message for the alert
        } else {
            // This is a generic handler for any other unexpected status codes
            showAlert('Error', message || 'An unexpected error occurred.', 'error');
        }
    } catch (error: any) {
        // This handles network errors or unhandled exceptions.
        // It's a good practice to still use the error object for these cases.
        showAlert('Error', error.message || 'Failed to create account. Please check your network and try again.', 'error');
    } finally {
        setIsLoading(false);
    }
};

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              title="Refreshing..."
              titleColor="#007AFF"
              colors={['#007AFF']}
              progressBackgroundColor="#ffffff"
            />
          }
        >
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={GlobalStyles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Create Account</Text>

            {/* Form Inputs */}
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color="#007AFF" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={formData.name}
                onChangeText={text => handleInputChange('name', text)}
                editable={!isLoading}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#007AFF" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={text => handleInputChange('email', text)}
                editable={!isLoading}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#007AFF" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                autoCapitalize="none"
                value={formData.password}
                onChangeText={text => handleInputChange('password', text)}
                editable={!isLoading}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#007AFF" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                secureTextEntry
                autoCapitalize="none"
                value={formData.confirmPassword}
                onChangeText={text => handleInputChange('confirmPassword', text)}
                editable={!isLoading}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, (isLoading || refreshing) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading || refreshing}
            >
              {isLoading || refreshing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading || refreshing}
            >
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Custom Alert Modal */}
      <CustomAlertModal // <-- ADDED
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#0A2540',
  },
  logoContainer: {
    alignItems: 'center',
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
    color: '#007AFF',
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
    marginTop: 25,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  loginPrompt: {
    fontSize: 16,
    color: '#C0C0C0',
    marginRight: 5,
  },
  loginLink: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorTextContainer: {
    height: 24,
    marginBottom: 10,
  },
  errorText: {
    color: '#FF6347',
    fontSize: 12,
    marginLeft: 5,
  },
});