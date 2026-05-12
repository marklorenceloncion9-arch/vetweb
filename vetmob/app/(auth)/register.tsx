import { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { showToast } from '@/components/Toast';

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Personal Info
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [age, setAge] = useState('');
  const [barangayId, setBarangayId] = useState<number | null>(null);
  const [barangayName, setBarangayName] = useState('');
  const [zone, setZone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [facebook, setFacebook] = useState('');

  // Dropdown states
  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [zoneModalVisible, setZoneModalVisible] = useState(false);

  // Dropdown data
  const [barangays, setBarangays] = useState<{ id: number; name: string }[]>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(true);

  const zones = ['Zone 1', 'Zone 2', 'Zone 3'];

  // Fetch barangays from API
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/mobile/barangays`);
        if (response.data.success) {
          setBarangays(response.data.barangays);
        }
      } catch (error) {
        console.error('Failed to fetch barangays:', error);
      } finally {
        setLoadingBarangays(false);
      }
    };

    fetchBarangays();
  }, []);
  
  // Step 2: Account Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Real-time validation helpers
  const validateName = (value: string) => value.trim().length >= 2 ? undefined : 'Name must be at least 2 characters';
  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return undefined;
  };
  const validatePhone = (value: string) => {
    if (!value.trim()) return 'Phone number is required';
    if (!/^\d{10,11}$/.test(value.replace(/\D/g, ''))) return 'Please enter a valid phone number';
    return undefined;
  };
  const validateAge = (value: string) => {
    if (!value.trim()) return 'Age is required';
    const num = Number(value);
    if (isNaN(num) || num < 1 || num > 120) return 'Please enter a valid age (1-120)';
    return undefined;
  };
  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string | undefined } = {};
    
    const firstnameError = validateName(firstname);
    const lastnameError = validateName(lastname);
    const phoneError = validatePhone(phoneNumber);
    const ageError = validateAge(age);

    if (firstnameError) newErrors.firstname = firstnameError;
    if (lastnameError) newErrors.lastname = lastnameError;
    if (phoneError) newErrors.phoneNumber = phoneError;
    if (ageError) newErrors.age = ageError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      shake();
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string | undefined } = {};

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      shake();
      return false;
    }
    return true;
  };

  // Get password strength
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: '', color: '', width: 0 };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 33 };
    if (pwd.length < 8) return { label: 'Fair', color: 'bg-yellow-500', width: 66 };
    if (pwd.length < 10 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Good', color: 'bg-blue-500', width: 80 };
    return { label: 'Strong', color: 'bg-green-500', width: 100 };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      setErrors({});
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const fullName = `${firstname} ${lastname}`.trim();
      
      const response = await axios.post(`${API_BASE_URL}/api/mobile/register`, {
        name: fullName,
        email,
        password,
        password_confirmation: confirmPassword,
        firstname,
        lastname,
        middlename,
        age: Number(age),
        barangay_id: barangayId,
        zone,
        phone_number: phoneNumber,
        facebook,
        role: 'client',
      });

      if (response.data.success) {
        showToast({ type: 'success', message: 'Account created successfully! Please sign in.' });
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Registration failed. Please try again.';
      const validationErrors = error.response?.data?.messages;
      
      if (validationErrors) {
        const errorText = Object.values(validationErrors).flat().join('\n');
        showToast({ type: 'error', message: errorText });
      } else {
        showToast({ type: 'error', message: errorMsg });
      }
    } finally {
      setLoading(false);
    }
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
            
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-blue-700 rounded-2xl items-center justify-center mb-3" style={{ shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
                <MaterialIcons name="pets" size={32} color="#ffffff" />
              </View>
              <ThemedText className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                Create Account
              </ThemedText>
              <ThemedText className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
                Join VetCare Pro today
              </ThemedText>
            </View>

            {/* Step Indicator */}
            <View className="flex-row items-center justify-center mb-6">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${step === 1 ? 'bg-blue-600' : 'bg-green-500'}`}>
                <ThemedText className="text-white text-sm font-bold">1</ThemedText>
              </View>
              <View className={`w-12 h-1 mx-2 ${step === 1 ? 'bg-slate-300' : 'bg-green-500'}`} />
              <View className={`w-8 h-8 rounded-full items-center justify-center ${step === 2 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <ThemedText className={`text-sm font-bold ${step === 2 ? 'text-white' : 'text-slate-600'}`}>2</ThemedText>
              </View>
            </View>

            {/* Form Card */}
            <Animated.View 
              className="bg-white dark:bg-slate-800 rounded-3xl p-6"
              style={{ transform: [{ translateX: shakeAnimation }], shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 2 }}
            >
              
              {step === 1 ? (
                <>
                  <ThemedText className="text-lg font-semibold text-slate-800 dark:text-white mb-4 text-center">
                    Personal Information
                  </ThemedText>
                  
                  {/* First Name */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      First Name *
                    </ThemedText>
                    <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border ${errors.firstname ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}>
                      <MaterialIcons name="person" size={20} color={errors.firstname ? '#ef4444' : '#64748b'} />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Enter first name"
                        placeholderTextColor="#94a3b8"
                        value={firstname}
                        onChangeText={(text) => {
                          setFirstname(text);
                          if (errors.firstname) setErrors({ ...errors, firstname: undefined });
                        }}
                        autoComplete="given-name"
                      />
                      {errors.firstname && <MaterialIcons name="error" size={18} color="#ef4444" />}
                    </View>
                    {errors.firstname && (
                      <ThemedText className="text-red-500 text-xs mt-1 ml-1">{errors.firstname}</ThemedText>
                    )}
                  </View>

                  {/* Last Name */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Last Name *
                    </ThemedText>
                    <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border ${errors.lastname ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}>
                      <MaterialIcons name="person-outline" size={20} color={errors.lastname ? '#ef4444' : '#64748b'} />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Enter last name"
                        placeholderTextColor="#94a3b8"
                        value={lastname}
                        onChangeText={(text) => {
                          setLastname(text);
                          if (errors.lastname) setErrors({ ...errors, lastname: undefined });
                        }}
                        autoComplete="family-name"
                      />
                      {errors.lastname && <MaterialIcons name="error" size={18} color="#ef4444" />}
                    </View>
                    {errors.lastname && (
                      <ThemedText className="text-red-500 text-xs mt-1 ml-1">{errors.lastname}</ThemedText>
                    )}
                  </View>

                  {/* Middle Name */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Middle Name
                    </ThemedText>
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600">
                      <MaterialIcons name="person-outline" size={20} color="#64748b" />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Enter middle name (optional)"
                        placeholderTextColor="#94a3b8"
                        value={middlename}
                        onChangeText={setMiddlename}
                        autoComplete="additional-name"
                      />
                    </View>
                  </View>

                  {/* Age */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Age *
                    </ThemedText>
                    <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border ${errors.age ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}>
                      <MaterialIcons name="cake" size={20} color={errors.age ? '#ef4444' : '#64748b'} />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Enter age"
                        placeholderTextColor="#94a3b8"
                        value={age}
                        onChangeText={(text) => {
                          setAge(text);
                          if (errors.age) setErrors({ ...errors, age: undefined });
                        }}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                      {errors.age && <MaterialIcons name="error" size={18} color="#ef4444" />}
                    </View>
                    {errors.age && (
                      <ThemedText className="text-red-500 text-xs mt-1 ml-1">{errors.age}</ThemedText>
                    )}
                  </View>

                  {/* Barangay Dropdown */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Barangay
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => !loadingBarangays && setBarangayModalVisible(true)}
                      disabled={loadingBarangays}
                      className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600 ${loadingBarangays ? 'opacity-70' : ''}`}
                    >
                      <MaterialIcons name="location-city" size={20} color="#64748b" />
                      <ThemedText className={`flex-1 ml-3 text-base ${barangayName ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                        {loadingBarangays ? 'Loading barangays...' : (barangayName || 'Select Barangay')}
                      </ThemedText>
                      {!loadingBarangays && <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />}
                    </TouchableOpacity>
                  </View>

                  {/* Zone Dropdown */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Zone
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => setZoneModalVisible(true)}
                      className="flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600"
                    >
                      <MaterialIcons name="location-on" size={20} color="#64748b" />
                      <ThemedText className={`flex-1 ml-3 text-base ${zone ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                        {zone || 'Select Zone'}
                      </ThemedText>
                      <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  {/* Phone Number */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Phone Number *
                    </ThemedText>
                    <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border ${errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}>
                      <MaterialIcons name="phone" size={20} color={errors.phoneNumber ? '#ef4444' : '#64748b'} />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Enter phone number"
                        placeholderTextColor="#94a3b8"
                        value={phoneNumber}
                        onChangeText={(text) => {
                          setPhoneNumber(text);
                          if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
                        }}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                      />
                      {errors.phoneNumber && <MaterialIcons name="error" size={18} color="#ef4444" />}
                    </View>
                    {errors.phoneNumber && (
                      <ThemedText className="text-red-500 text-xs mt-1 ml-1">{errors.phoneNumber}</ThemedText>
                    )}
                  </View>

                  {/* Facebook */}
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Facebook
                    </ThemedText>
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-600">
                      <MaterialIcons name="facebook" size={20} color="#64748b" />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Facebook profile (optional)"
                        placeholderTextColor="#94a3b8"
                        value={facebook}
                        onChangeText={setFacebook}
                      />
                    </View>
                  </View>

                  {/* Next Button */}
                  <TouchableOpacity
                    className="py-4 rounded-xl items-center bg-blue-600"
                    onPress={handleNext}
                  >
                    <ThemedText className="text-white text-base font-semibold">
                      Next →
                    </ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ThemedText className="text-lg font-semibold text-slate-800 dark:text-white mb-4 text-center">
                    Create Account
                  </ThemedText>

                  {/* Email */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Email *
                    </ThemedText>
                    <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border ${errors.email ? 'border-red-500 bg-red-50' : email && !errors.email ? 'border-green-500 bg-green-50' : 'border-slate-200 dark:border-slate-600'}`}>
                      <MaterialIcons name="email" size={20} color={errors.email ? '#ef4444' : email && !errors.email ? '#22c55e' : '#64748b'} />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Enter your email"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                      {errors.email && <MaterialIcons name="error" size={18} color="#ef4444" />}
                      {!errors.email && email && <MaterialIcons name="check-circle" size={18} color="#22c55e" />}
                    </View>
                    {errors.email && (
                      <ThemedText className="text-red-500 text-xs mt-1 ml-1">{errors.email}</ThemedText>
                    )}
                  </View>

                  {/* Password */}
                  <View className="mb-3">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Password *
                    </ThemedText>
                    <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border ${errors.password ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}>
                      <MaterialIcons name="lock" size={20} color={errors.password ? '#ef4444' : '#64748b'} />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Create password (min 6 chars)"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry={!showPassword}
                        autoComplete="new-password"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="p-1"
                      >
                        <MaterialIcons
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <ThemedText className="text-red-500 text-xs mt-1 ml-1">{errors.password}</ThemedText>
                    )}
                    
                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <View className="mt-2">
                        <View className="flex-row items-center mb-1">
                          <View className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <View className={`h-full ${passwordStrength.color}`} style={{ width: `${passwordStrength.width}%` }} />
                          </View>
                          <ThemedText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                            {passwordStrength.label}
                          </ThemedText>
                        </View>
                        <ThemedText className="text-xs text-slate-400">
                          Use 8+ chars with uppercase, number & symbol
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View className="mb-4">
                    <ThemedText className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
                      Confirm Password *
                    </ThemedText>
                    <View className={`flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 border ${errors.confirmPassword ? 'border-red-500 bg-red-50' : confirmPassword && confirmPassword === password ? 'border-green-500 bg-green-50' : 'border-slate-200 dark:border-slate-600'}`}>
                      <MaterialIcons name="lock-outline" size={20} color={errors.confirmPassword ? '#ef4444' : confirmPassword && confirmPassword === password ? '#22c55e' : '#64748b'} />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 dark:text-white"
                        placeholder="Confirm your password"
                        placeholderTextColor="#94a3b8"
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        secureTextEntry={!showConfirmPassword}
                        autoComplete="new-password"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="p-1"
                      >
                        <MaterialIcons
                          name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                      {errors.confirmPassword && <MaterialIcons name="error" size={18} color="#ef4444" />}
                      {!errors.confirmPassword && confirmPassword && confirmPassword === password && <MaterialIcons name="check-circle" size={18} color="#22c55e" />}
                    </View>
                    {errors.confirmPassword && (
                      <ThemedText className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</ThemedText>
                    )}
                  </View>

                  {/* Button Row */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 py-4 rounded-xl items-center bg-slate-200 dark:bg-slate-700"
                      onPress={handleBack}
                    >
                      <ThemedText className="text-slate-700 dark:text-slate-300 text-base font-semibold">
                        ← Back
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 py-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                      style={{ backgroundColor: '#1d4ed8' }}
                      onPress={handleRegister}
                      disabled={loading}
                    >
                      <ThemedText className="text-white text-base font-semibold">
                        {loading ? 'Creating...' : 'Sign Up'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Animated.View>

            {/* Footer */}
            <View className="flex-row justify-center mt-6">
              <ThemedText className="text-slate-500 dark:text-slate-400 text-sm">
                Already have an account?{' '}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <ThemedText className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  Sign In
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barangay Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={barangayModalVisible}
        onRequestClose={() => setBarangayModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6 max-h-96">
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-lg font-semibold text-slate-800 dark:text-white">
                Select Barangay
              </ThemedText>
              <TouchableOpacity onPress={() => setBarangayModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={barangays}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setBarangayId(item.id);
                    setBarangayName(item.name);
                    setBarangayModalVisible(false);
                  }}
                  className={`py-4 px-4 border-b border-slate-100 dark:border-slate-700 ${
                    barangayId === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <ThemedText className={`text-base ${
                    barangayId === item.id ? 'text-blue-600 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Zone Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={zoneModalVisible}
        onRequestClose={() => setZoneModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6 max-h-96">
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText className="text-lg font-semibold text-slate-800 dark:text-white">
                Select Zone
              </ThemedText>
              <TouchableOpacity onPress={() => setZoneModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={zones}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setZone(item);
                    setZoneModalVisible(false);
                  }}
                  className={`py-4 px-4 border-b border-slate-100 dark:border-slate-700 ${
                    zone === item ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <ThemedText className={`text-base ${
                    zone === item ? 'text-blue-600 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
