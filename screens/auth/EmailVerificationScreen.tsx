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
    Image, // <-- ADDED for logo placeholder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AuthService } from '../../requests';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, EmailVerificationScreenRouteProp } from '../../types/screenprops';
import CustomAlertModal from '../../components/organisms/CustomAlertModal';

// Resend timer in seconds
const RESEND_TIMEOUT = 60;

export default function VerificationScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
    const route = useRoute<EmailVerificationScreenRouteProp>();

    // Get email from navigation parameters
    const email = route.params?.email || '';

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
    const codeInputRef = useRef<TextInput>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Alert State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '',
        message: '',
        icon: 'info',
    });
    const [alertNavigation, setAlertNavigation] = useState<(() => void) | null>(null);

    // Start the countdown timer when screen mounts
    useEffect(() => {
        startCountdown();

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

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

    const startCountdown = () => {
        setResendDisabled(true);
        setCountdown(RESEND_TIMEOUT);

        if (countdownRef.current) {
            clearInterval(countdownRef.current);
        }

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

    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            showAlert('Invalid Code', 'Verification code must be 6 digits.', 'error');
            return;
        }

        try {
            setIsLoading(true);
            const response = await AuthService.verifyEmail(code, email);
            const {status, message} = response.data;
            if (status === 200) {
                  showAlert(
                    'Email Verified!',
                    message,
                    'success',
                    () => navigation.navigate('Login')
                );
            }else if(status === 404){
                  showAlert(
                    'Verification Failed',
                    message,
                    'error'
                );
            } else if(status === 400){
                showAlert(
                    'Verification Failed',
                    message,
                    'error'
                );

            }else {
               
                showAlert('Verification Failed', message, 'error');
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Verification failed. Please check your code and try again.';
            showAlert('Verification Failed', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            showAlert('Error', 'No email address found for resending verification', 'error');
            return;
        }
        if (resendDisabled) return; // Prevent multiple clicks if countdown is running

        try {
            setIsLoading(true);
            const response = await AuthService.resendVerification(email);
            const message = response.data.message || 'A new verification email has been sent to your email address.';

            startCountdown();
            showAlert('Email Sent', message, 'success');
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to resend verification email. Please try again.';
            showAlert('Resend Failed', errorMessage, 'error');
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
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        {/* Logo Container (Mocked based on RegisterScreen's usage) */}
                        <View style={styles.logoContainer}>
                            {/* Assuming you have a global style for the logo size */}
                            <Image
                                source={require('../../assets/logo.png')} // Replace with your actual logo path
                                style={localStyles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.title}>Verify Email</Text>

                        <Text style={localStyles.subtitle}>
                            We've sent a 6-digit verification code to:
                        </Text>
                        
                        <Text style={localStyles.emailText}>{email}</Text>

                        {/* Verification Code Input */}
                        <View style={styles.inputWrapper}>
                            <Feather name="shield" size={20} color="#007AFF" style={styles.icon} />
                            <TextInput
                                ref={codeInputRef}
                                style={styles.inputField}
                                placeholder="Enter 6-digit code"
                                placeholderTextColor="#888"
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus={!code}
                                editable={!isLoading}
                                onSubmitEditing={handleVerify}
                            />
                        </View>
                        <View style={localStyles.errorTextContainer}>
                            {/* Error Text Placeholder if you implement one */}
                        </View>

                        {/* Resend Link and Countdown */}
                        <View style={localStyles.resendContainer}>
                            <Text style={localStyles.resendText}>Didn't receive the code?</Text>
                            <TouchableOpacity onPress={handleResend} disabled={resendDisabled || isLoading}>
                                <Text
                                    style={[
                                        localStyles.resendLink,
                                        (resendDisabled || isLoading) && localStyles.disabledResend,
                                    ]}
                                >
                                    Resend {resendDisabled && countdown > 0 ? `(${countdown}s)` : ''}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[styles.button, (isLoading || code.length < 6) && styles.disabledButton]}
                            onPress={handleVerify}
                            disabled={isLoading || code.length < 6}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Verify Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Back to Login Footer */}
                    <View style={styles.footer}>
                        <Text style={localStyles.backPrompt}>Go back and sign in?</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            disabled={isLoading}
                        >
                            <Text style={localStyles.backLink}>Login</Text>
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

// --- Styles based on LoginScreen/RegisterScreen ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0A2540', // Dark background
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
        marginBottom: 5, // Adjusted to match the space before error text in other screens
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
});

// Custom styles specific to the Verification Screen
const localStyles = StyleSheet.create({
    logo: {
        width: 100, // Placeholder size, adjust to match GlobalStyles.logo if possible
        height: 100,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 5,
    },
    emailText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0A2540',
        marginBottom: 20,
        textAlign: 'center',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    resendText: {
        fontSize: 14,
        color: '#666',
        marginRight: 5,
    },
    resendLink: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    disabledResend: {
        color: '#999',
    },
    backPrompt: {
        fontSize: 16,
        color: '#C0C0C0',
        marginRight: 5,
    },
    backLink: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    errorTextContainer: {
        height: 27,
    },
});