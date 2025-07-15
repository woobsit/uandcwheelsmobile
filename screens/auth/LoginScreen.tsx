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
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalStyles from '../../assets/styles/globalStyles';
import Feather from 'react-native-vector-icons/Feather';
import { AuthService } from '../../requests';
import { matchEmail } from '../../utils/pregmatch';
import { showApiErrorAlert, saveTokens, loadRememberedEmail } from '../../utils/apiHelpers';
import useRefreshControl from '../../hooks/useRefreshControl';

export default function LoginScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false, // Added rememberMe to form data
  });

  // Create refresh control logic
  const { refreshing, onRefresh } = useRefreshControl({
    refreshAction: async () => {
      resetForm();
      //Alert.alert('Form Reset', 'The form has been reset');

      // Scroll to top after refresh
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    },
    //onRefreshStart: () => console.log('Refresh started'),
    //onRefreshEnd: () => console.log('Refresh completed'),
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

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!matchEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
        remember_token: formData.rememberMe, // Send rememberMe as remember_token
      });

      //  if (!response.data.data.accessToken || !response.data.data.refreshToken) {
      //    throw new Error('Tokens not found in response');
      //  }

      //Save tokens to secure storage
      //  await saveTokens(
      //    response.data.data.accessToken,
      //    response.data.data.refreshToken,
      //    formData.rememberMe,
      //    formData.email
      //  );

      // Redirect to main app
      navigation.navigate('Dashboard');
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        setErrors(prev => ({
          ...prev,
          password: 'Invalid email or password',
        }));
      } else if (error.response?.status === 403) {
        Alert.alert('Email Not Verified', 'Please verify your email before logging in', [
          {
            text: 'Resend Verification',
            onPress: () => {
              AuthService.resendVerification(formData.email)
                .then(() => Alert.alert('Email Sent', 'A new verification email has been sent'))
                .catch(err => showApiErrorAlert(err, 'Failed to resend verification'));
            },
          },
          { text: 'OK' },
        ]);
      } else if (error.message === 'Tokens not found in response') {
        Alert.alert('Login Error', 'Authentication tokens not received');
      } else {
        showApiErrorAlert(error, 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
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

            {/* Email Input */}
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

            {/* Password Input */}
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
            {/* Remember Me and Forgot Password Row */}
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
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.registerPrompt}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#363636',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 5,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#a0c8ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: -10,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
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
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  registerPrompt: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  registerLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  errorTextContainer: {
    height: 24,
  },
});
