import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/auth-context';
import { showToast } from '@/components/Toast';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // Walk-in account claim states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimPasswordConfirmation, setClaimPasswordConfirmation] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimErrors, setClaimErrors] = useState<{ password?: string; password_confirmation?: string }>({});
  
  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotErrors, setForgotErrors] = useState<{ email?: string; otp?: string; password?: string; confirmPassword?: string }>({});
  const [showOtpSuccess, setShowOtpSuccess] = useState(false);

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateClaimPassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    const newErrors: { email?: string; password?: string } = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);

    if (emailError || passwordError) {
      shake();
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    console.log('Attempting login to:', `${API_BASE_URL}/api/mobile/login`);
    console.log('Login credentials:', { email, password: '***' }); // Log email only for security
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mobile/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        showToast({ type: 'success', message: 'Login successful!' });
        // Store token and user data using auth context
        console.log('Login API success, calling auth context login...');
        await login(response.data.token, response.data.user);
        console.log('Auth context login completed, navigating to home...');
        // Navigate directly to home
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        showToast({ type: 'error', message: response.data.error || 'Login failed' });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Check if this is a walk-in client who needs to use forgot password
      if (error.response?.data?.walk_in_forgot_password_required) {
        setLoading(false);
        const walkInEmail = error.response?.data?.user?.email || email;
        // Show alert explaining the situation, then redirect to forgot password
        Alert.alert(
          'Walk-in Client Account',
          'Your account was created at the clinic. Please use Forgot Password to set up your password.',
          [
            {
              text: 'Go to Forgot Password',
              onPress: () => {
                setForgotEmail(walkInEmail);
                setShowForgotModal(true);
                // Auto-send OTP for convenience
                setTimeout(() => {
                  handleSendOtpForWalkIn(walkInEmail);
                }, 500);
              }
            }
          ]
        );
        return;
      }
      
      let message = 'Login failed. Please try again.';
      if (error.response?.data?.error) {
        message = error.response.data.error;
        if (error.response.data.debug) {
          console.log('Debug info:', error.response.data.debug);
        }
      } else if (error.message) {
        message = error.message;
      }
      
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  // Handle walk-in account password setup
  const handleClaimAccount = async () => {
    const passwordError = validateClaimPassword(claimPassword);
    const confirmationError = claimPassword !== claimPasswordConfirmation 
      ? 'Passwords do not match' 
      : undefined;

    const newErrors: { password?: string; password_confirmation?: string } = {};
    if (passwordError) newErrors.password = passwordError;
    if (confirmationError) newErrors.password_confirmation = confirmationError;

    setClaimErrors(newErrors);

    if (passwordError || confirmationError) {
      shake();
      return;
    }

    setClaimLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mobile/claim-account`, {
        email,
        password: claimPassword,
        password_confirmation: claimPasswordConfirmation,
      });

      if (response.data.success) {
        showToast({ type: 'success', message: 'Your account has been set up! You can now log in with your new password.' });
        setShowClaimModal(false);
        setClaimPassword('');
        setClaimPasswordConfirmation('');
        setPassword(claimPassword); // Pre-fill for convenience
      } else {
        showToast({ type: 'error', message: response.data.error || 'Failed to set up account' });
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to set up account. Please try again.';
      showToast({ type: 'error', message });
    } finally {
      setClaimLoading(false);
    }
  };

  // Forgot Password Functions
  const handleSendOtp = async () => {
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotErrors({ email: 'Please enter a valid email' });
      shake();
      return;
    }

    await sendOtpWithEmail(forgotEmail);
  };

  const handleSendOtpForWalkIn = async (email: string) => {
    await sendOtpWithEmail(email);
  };

  const sendOtpWithEmail = async (emailToUse: string) => {
    setForgotLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mobile/send-otp`, {
        email: emailToUse.trim().toLowerCase(),
        purpose: 'password_reset',
      });

      if (response.data.success) {
        if (response.data.otp) {
          // Email failed, show OTP for testing
          Alert.alert('OTP Generated', `Your OTP is: ${response.data.otp}\n\n(Email failed: ${response.data.email_error || 'Check config'})`);
        } else {
          // Email sent successfully
          Alert.alert('OTP Sent', 'Check your email for the OTP code.');
        }
        setForgotStep(2);
        setForgotErrors({});
      } else {
        Alert.alert('Error', response.data.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to send OTP';
      Alert.alert('Error', message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotErrors({ otp: 'Please enter the 6-digit OTP' });
      shake();
      return;
    }

    setForgotLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mobile/verify-otp`, {
        email: forgotEmail,
        code: forgotOtp,
        purpose: 'password_reset',
      });

      if (response.data.success) {
        setForgotErrors({});
        setShowOtpSuccess(true);
        setTimeout(() => {
          setShowOtpSuccess(false);
          setForgotStep(3);
        }, 2000);
      } else {
        Alert.alert('Error', response.data.error || 'Invalid OTP');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to verify OTP';
      Alert.alert('Error', message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const errors: { password?: string; confirmPassword?: string } = {};
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setForgotErrors(errors);
      shake();
      return;
    }

    setForgotLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mobile/reset-password-otp`, {
        email: forgotEmail,
        code: forgotOtp,
        password: forgotNewPassword,
        password_confirmation: forgotConfirmPassword,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Password reset successfully! You can now log in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowForgotModal(false);
                setForgotStep(1);
                setForgotEmail('');
                setForgotOtp('');
                setForgotNewPassword('');
                setForgotConfirmPassword('');
                setPassword(forgotNewPassword); // Pre-fill for convenience
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.error || 'Failed to reset password');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to reset password';
      Alert.alert('Error', message);
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotForm = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotErrors({});
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center"
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Container */}
          <View className="flex-1 justify-center px-6 py-8">
            
            {/* Header / Logo */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-blue-700 rounded-2xl items-center justify-center mb-4" style={{ shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
                <MaterialIcons name="pets" size={40} color="#ffffff" />
              </View>
              <ThemedText className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                Welcome Back
              </ThemedText>
              <ThemedText className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
                Sign in to continue
              </ThemedText>
            </View>

            {/* Form Card */}
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-6" style={{ shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 2 }}>
              
              {/* Email Input */}
              <Animated.View 
                className="mb-4"
                style={{ transform: [{ translateX: errors.email ? shakeAnimation : 0 }] }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                    Email Address
                  </ThemedText>
                  {errors.email && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="error" size={14} color="#ef4444" />
                      <Text className="text-red-500 text-xs ml-1">{errors.email}</Text>
                    </View>
                  )}
                </View>
                <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3.5 border-2 ${errors.email ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-600 focus:border-blue-500'}`}>
                  <MaterialIcons name="email" size={22} color={errors.email ? '#ef4444' : '#64748b'} />
                  <TextInput
                    className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                    placeholder="Enter your email"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) {
                        const validationError = validateEmail(text);
                        setErrors({ ...errors, email: validationError });
                      }
                    }}
                    onBlur={() => {
                      const validationError = validateEmail(email);
                      setErrors({ ...errors, email: validationError });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                  />
                  {email.length > 0 && !errors.email && (
                    <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                  )}
                </View>
              </Animated.View>

              {/* Password Input */}
              <Animated.View 
                className="mb-2"
                style={{ transform: [{ translateX: errors.password ? shakeAnimation : 0 }] }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                    Password
                  </ThemedText>
                  {errors.password && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="error" size={14} color="#ef4444" />
                      <Text className="text-red-500 text-xs ml-1">{errors.password}</Text>
                    </View>
                  )}
                </View>
                <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3.5 border-2 ${errors.password ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
                  <MaterialIcons name="lock" size={22} color={errors.password ? '#ef4444' : '#64748b'} />
                  <TextInput
                    className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        const validationError = validatePassword(text);
                        setErrors({ ...errors, password: validationError });
                      }
                    }}
                    onBlur={() => {
                      const validationError = validatePassword(password);
                      setErrors({ ...errors, password: validationError });
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-1"
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={22}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Forgot Password */}
              <TouchableOpacity 
                className="self-end mb-6 mt-1" 
                disabled={loading}
                onPress={() => {
                  setForgotEmail(email); // Pre-fill with login email if entered
                  setShowForgotModal(true);
                }}
              >
                <ThemedText className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                className={`py-4 rounded-xl items-center flex-row justify-center ${loading ? 'opacity-80' : 'active:scale-95'}`}
                style={{ backgroundColor: '#2563eb' }}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                    <ThemedText className="text-white text-base font-semibold">
                      Signing In...
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText className="text-white text-base font-semibold">
                      Sign In
                    </ThemedText>
                    <MaterialIcons name="arrow-forward" size={20} color="#ffffff" className="ml-2" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="flex-row justify-center mt-6">
              <ThemedText className="text-slate-500 dark:text-slate-400 text-sm">
                Don't have an account?{' '}
              </ThemedText>
              <TouchableOpacity 
                onPress={() => !loading && router.push('/(auth)/register')}
                disabled={loading}
              >
                <ThemedText className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  Sign Up
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Claim Account Modal for Walk-in Clients */}
      {showClaimModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-3">
                <MaterialIcons name="person-add" size={24} color="#2563eb" />
              </View>
              <ThemedText className="text-xl font-bold text-slate-800 dark:text-white text-center">
                Set Up Your Account
              </ThemedText>
              <ThemedText className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
                You were registered as a walk-in client. Please set your password to access your account.
              </ThemedText>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </ThemedText>
              <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border-2 ${claimErrors.password ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}>
                <MaterialIcons name="lock" size={22} color={claimErrors.password ? '#ef4444' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                  placeholder="Enter new password"
                  placeholderTextColor="#94a3b8"
                  value={claimPassword}
                  onChangeText={setClaimPassword}
                  secureTextEntry
                  editable={!claimLoading}
                />
              </View>
              {claimErrors.password && (
                <Text className="text-red-500 text-xs mt-1">{claimErrors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </ThemedText>
              <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border-2 ${claimErrors.password_confirmation ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}>
                <MaterialIcons name="lock" size={22} color={claimErrors.password_confirmation ? '#ef4444' : '#64748b'} />
                <TextInput
                  className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                  placeholder="Confirm password"
                  placeholderTextColor="#94a3b8"
                  value={claimPasswordConfirmation}
                  onChangeText={setClaimPasswordConfirmation}
                  secureTextEntry
                  editable={!claimLoading}
                />
              </View>
              {claimErrors.password_confirmation && (
                <Text className="text-red-500 text-xs mt-1">{claimErrors.password_confirmation}</Text>
              )}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600"
                onPress={() => {
                  setShowClaimModal(false);
                  setClaimPassword('');
                  setClaimPasswordConfirmation('');
                  setClaimErrors({});
                }}
                disabled={claimLoading}
              >
                <ThemedText className="text-slate-700 dark:text-slate-300 text-center font-medium">
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-blue-600"
                onPress={handleClaimAccount}
                disabled={claimLoading}
              >
                {claimLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText className="text-white text-center font-semibold">
                    Set Password
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm">
            {/* Header */}
            <View className="items-center mb-4">
              <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-3">
                <MaterialIcons name="lock-reset" size={24} color="#2563eb" />
              </View>
              <ThemedText className="text-xl font-bold text-slate-800 dark:text-white text-center">
                Forgot Password
              </ThemedText>
              <ThemedText className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
                {forgotStep === 1 && "Enter your email to receive OTP"}
                {forgotStep === 2 && "Enter the 6-digit code sent to your email"}
                {forgotStep === 3 && "Create your new password"}
              </ThemedText>
            </View>

            {/* Step 1: Email */}
            {forgotStep === 1 && (
              <View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </ThemedText>
                  <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border-2 ${forgotErrors.email ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}>
                    <MaterialIcons name="email" size={22} color={forgotErrors.email ? '#ef4444' : '#64748b'} />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="Enter your email"
                      placeholderTextColor="#94a3b8"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!forgotLoading}
                    />
                  </View>
                  {forgotErrors.email && (
                    <Text className="text-red-500 text-xs mt-1">{forgotErrors.email}</Text>
                  )}
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600"
                    onPress={resetForgotForm}
                    disabled={forgotLoading}
                  >
                    <ThemedText className="text-slate-700 dark:text-slate-300 text-center font-medium">
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl bg-blue-600"
                    onPress={handleSendOtp}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <ThemedText className="text-white text-center font-semibold">
                        Send OTP
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 2: OTP Verification */}
            {forgotStep === 2 && (
              <View>
                {/* Success Message */}
                {showOtpSuccess && (
                  <View className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center mr-3">
                        <MaterialIcons name="check" size={24} color="#ffffff" />
                      </View>
                      <View className="flex-1">
                        <ThemedText className="text-green-800 dark:text-green-300 font-semibold text-base">
                          OTP Verified!
                        </ThemedText>
                        <ThemedText className="text-green-600 dark:text-green-400 text-sm mt-0.5">
                          Proceeding to password reset...
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                )}

                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    OTP Code
                  </ThemedText>
                  <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border-2 ${forgotErrors.otp ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}>
                    <MaterialIcons name="vpn-key" size={22} color={forgotErrors.otp ? '#ef4444' : '#64748b'} />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#94a3b8"
                      value={forgotOtp}
                      onChangeText={setForgotOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!forgotLoading}
                    />
                  </View>
                  {forgotErrors.otp && (
                    <Text className="text-red-500 text-xs mt-1">{forgotErrors.otp}</Text>
                  )}
                </View>

                <TouchableOpacity
                  className="mb-4"
                  onPress={handleSendOtp}
                  disabled={forgotLoading}
                >
                  <ThemedText className="text-sm text-blue-600 dark:text-blue-400 text-center">
                    Resend OTP
                  </ThemedText>
                </TouchableOpacity>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600"
                    onPress={() => setForgotStep(1)}
                    disabled={forgotLoading}
                  >
                    <ThemedText className="text-slate-700 dark:text-slate-300 text-center font-medium">
                      Back
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl bg-blue-600"
                    onPress={handleVerifyOtp}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <ThemedText className="text-white text-center font-semibold">
                        Verify
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 3: New Password */}
            {forgotStep === 3 && (
              <View>
                <View className="mb-4">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </ThemedText>
                  <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border-2 ${forgotErrors.password ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}>
                    <MaterialIcons name="lock" size={22} color={forgotErrors.password ? '#ef4444' : '#64748b'} />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="Enter new password (min 8 chars)"
                      placeholderTextColor="#94a3b8"
                      value={forgotNewPassword}
                      onChangeText={setForgotNewPassword}
                      secureTextEntry
                      editable={!forgotLoading}
                    />
                  </View>
                  {forgotErrors.password && (
                    <Text className="text-red-500 text-xs mt-1">{forgotErrors.password}</Text>
                  )}
                </View>

                <View className="mb-6">
                  <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </ThemedText>
                  <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border-2 ${forgotErrors.confirmPassword ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}>
                    <MaterialIcons name="lock" size={22} color={forgotErrors.confirmPassword ? '#ef4444' : '#64748b'} />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                      placeholder="Confirm new password"
                      placeholderTextColor="#94a3b8"
                      value={forgotConfirmPassword}
                      onChangeText={setForgotConfirmPassword}
                      secureTextEntry
                      editable={!forgotLoading}
                    />
                  </View>
                  {forgotErrors.confirmPassword && (
                    <Text className="text-red-500 text-xs mt-1">{forgotErrors.confirmPassword}</Text>
                  )}
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600"
                    onPress={() => setForgotStep(2)}
                    disabled={forgotLoading}
                  >
                    <ThemedText className="text-slate-700 dark:text-slate-300 text-center font-medium">
                      Back
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl bg-blue-600"
                    onPress={handleResetPassword}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <ThemedText className="text-white text-center font-semibold">
                        Reset Password
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
