import { useEffect, useRef } from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-blue-600">
      {/* Background Pattern */}
      <View className="absolute inset-0 opacity-10">
        <View className="absolute top-20 left-10 w-32 h-32 border-4 border-white rounded-full" />
        <View className="absolute top-40 right-20 w-24 h-24 border-4 border-white rounded-full" />
        <View className="absolute bottom-40 left-20 w-16 h-16 border-4 border-white rounded-full" />
        <View className="absolute bottom-60 right-10 w-40 h-40 border-4 border-white rounded-full" />
      </View>

      {/* Content */}
      <Animated.View 
        className="flex-1 justify-center items-center px-8"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Logo */}
        <Animated.View 
          className="w-28 h-28 bg-white rounded-3xl items-center justify-center mb-8"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 16, transform: [{ scale: scaleAnim }] }}
        >
          <MaterialIcons name="pets" size={56} color="#2563eb" />
        </Animated.View>

        {/* Title */}
        <ThemedText className="text-4xl font-bold text-white text-center mb-2">
          VetMob
        </ThemedText>
        <ThemedText className="text-xl text-blue-100 text-center mb-4">
          Pet Care Made Simple
        </ThemedText>

        {/* Description */}
        <ThemedText className="text-blue-100 text-center mb-12 px-4 leading-6">
          Book appointments, manage your pets, and track their health all in one place.
        </ThemedText>

        {/* Buttons */}
        <View className="w-full gap-4">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="bg-white py-4 rounded-2xl items-center active:scale-95"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, transform: [{ scale: 1 }] }}
          >
            <ThemedText className="text-blue-600 font-bold text-lg">
              Sign In
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="bg-blue-500 py-4 rounded-2xl items-center border-2 active:scale-95"
            style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <ThemedText className="text-white font-bold text-lg">
              Create Account
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="absolute bottom-8 flex-row items-center">
          <MaterialIcons name="verified" size={16} color="#93c5fd" />
          <ThemedText className="text-blue-200 text-sm ml-2">
            Trusted by 1000+ pet owners
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}
