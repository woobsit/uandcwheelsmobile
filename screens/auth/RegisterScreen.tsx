import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalStyles from '../../assets/styles/globalStyles';
import Feather from 'react-native-vector-icons/Feather';
import useRefreshControl from '../../hooks/useRefreshControl';
import { matchEmail } from '../../utils/pregmatch';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Function to reset the form
  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

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

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      fullName: '',
      email: '',

      password: '',
      confirmPassword: '',
    };

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      valid = false;
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
      valid = false;
    }

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

    // Validate confirm password
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

      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Registration successful:', formData);
      Alert.alert('Success', 'Your account has been created!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
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
          <View style={styles.form}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={GlobalStyles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Create Account</Text>

            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color="#999" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Full Name"
                value={formData.fullName}
                onChangeText={text => setFormData({ ...formData, fullName: text })}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#999" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={text => setFormData({ ...formData, email: text })}
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
                autoCapitalize="none"
                value={formData.password}
                onChangeText={text => setFormData({ ...formData, password: text })}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#999" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Confirm Password"
                secureTextEntry
                autoCapitalize="none"
                value={formData.confirmPassword}
                onChangeText={text => setFormData({ ...formData, confirmPassword: text })}
              />
            </View>
            <View style={styles.errorTextContainer}>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <View>
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
          </View>

          <View style={styles.footer}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading || refreshing}
            >
              <Text style={styles.loginLink}>Login</Text>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: 40,
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 3,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  loginPrompt: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  errorTextContainer: {
    height: 24,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    // marginBottom: 10,
    // marginLeft: 5,
  },
});
