import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthLayout effect - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    if (isLoading) return;

    // If user is authenticated, redirect to tabs
    if (isAuthenticated) {
      console.log('Redirecting to home...');
      // Small delay to ensure state is settled and show success
      setTimeout(() => {
        console.log('Executing redirect');
        router.replace('/');
      }, 100);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="index" />
    </Stack>
  );
}
