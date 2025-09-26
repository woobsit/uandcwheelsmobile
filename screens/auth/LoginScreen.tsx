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
  Switch,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalStyles from '../../assets/styles/globalStyles';
import Feather from 'react-native-vector-icons/Feather';
import { AuthService } from '../../requests';
import { matchEmail } from '../../utils/pregmatch';
import { saveTokens, loadRememberedEmail } from '../../utils/apiHelpers';
import useRefreshControl from '../../hooks/useRefreshControl';
import { useNavigation } from '@react-navigation/native';
import { LoginScreenProps } from '../../types/screenprops';
import CustomAlertModal from '../../components/organisms/CustomAlertModal'; // Import your custom modal

export default function LoginScreen() {

  const navigation = useNavigation<LoginScreenProps['navigation']>();
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // New state variables for the custom alert modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: '',
    message: '',
    icon: 'info',
  });
  
  // New state to handle the post-alert navigation, if needed
  const [alertNavigation, setAlertNavigation] = useState<(() => void) | null>(null);

  // Create refresh control logic
  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      resetForm();
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    },
  });

  // Function to reset the form
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      rememberMe: false,
    });
    setErrors({
      email: '',
      password: '',
    });
  };

  // Function to show the custom alert
  const showAlert = (title: string, message: string, icon: 'success' | 'error' | 'info' = 'info', navAction: (() => void) | null = null) => {
    setModalProps({ title, message, icon });
    setIsModalVisible(true);
    setAlertNavigation(() => navAction);
  };
  
  // Function to hide the custom alert and execute a navigation action
  const handleModalPress = () => {
    setIsModalVisible(false);
    if (alertNavigation) {
      alertNavigation();
    }
    setAlertNavigation(null);
  };

  // Load saved credentials
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedEmail = await loadRememberedEmail();
        if (savedEmail) {
          setFormData(prev => ({
            ...prev,
            email: savedEmail,
            rememberMe: true,
          }));
        }
      } catch (error) {
        console.log('Error loading credentials', error);
      }
    };
    loadCredentials();
  }, []);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
    };

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
      newErrors.password = 'Password is incorrect';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };
  const handleLogin = async () => {
    if (!validateForm()) return;
 try {
  setIsLoading(true);

  const response = await AuthService.login({
    email: formData.email,
    password: formData.password,
  });

  const { status, data, message } = response.data;

  // Handle a successful login (HTTP status 200)
  if (status === 200) {
    if (!data.accessToken || !data.refreshToken) {
      showAlert('Error', 'Tokens not found in response', 'error');
      return;
    }
    await saveTokens(data.accessToken, data.refreshToken, formData.rememberMe, formData.email);
    navigation.navigate('Dashboard');
  } 
  
  // Handle specific error codes
  else if (status === 401) {
    showAlert('Error', message, 'error');
  } 
  else if (status === 403) {
    showAlert('Error', message, 'error');
  } 
  
  // Handle the email not verified case
  else {
    showAlert(
      'Email Not Verified', 
      'Please verify your email before logging in.', 
      'error',
      () => {
        AuthService.resendVerification(formData.email)
          .then(() => showAlert('Email Sent', 'A new verification email has been sent.', 'success'))
          .catch(err => showAlert('Error', err.message || 'Failed to resend verification.', 'error'));
      }
    );
  }
} catch (error) {
  // It's a good practice to handle network or other unhandled errors here.
  showAlert('Error', 'An unexpected error occurred. Please try again later.', 'error');
} finally {
  setIsLoading(false);
}
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleRememberMe = () => {
    handleInputChange('rememberMe', !formData.rememberMe);
  };
  
  return (
    <SafeAreaView edges={['bottom']} style={GlobalStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
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
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={GlobalStyles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Welcome Back</Text>

            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#999" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={text => handleInputChange('email', text)}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#999" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Password"
                secureTextEntry
                value={formData.password}
                onChangeText={text => handleInputChange('password', text)}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <View style={styles.rememberRow}>
              <TouchableOpacity onPress={toggleRememberMe} style={styles.rememberMeContainer}>
                <Switch
                  value={formData.rememberMe}
                  onValueChange={value => handleInputChange('rememberMe', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={formData.rememberMe ? '#007AFF' : '#f4f3f4'}
                />
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.guestButton, isLoading && styles.disabledButton]}
              onPress={() => navigation.navigate('BookTransport')}
              disabled={isLoading}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.registerPrompt}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Custom Alert Modal */}
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
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
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
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#0A2540',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
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
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  registerPrompt: {
    fontSize: 16,
    color: '#C0C0C0',
    marginRight: 5,
  },
  registerLink: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF6347',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  errorTextContainer: {
    height: 27,
  },
  guestButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  guestButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});