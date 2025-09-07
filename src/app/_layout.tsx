// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import '../global.css';

// Loading component
function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}

// Main app content with navigation logic
function RootLayoutNav() {
  const { isLoading, isAuthenticated, hasCompleteAcademicInfo } = useAuth();
  const segments = useSegments();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isLoading || isNavigating) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    const navigate = async (path: string) => {
      setIsNavigating(true);
      try {
        await router.replace(path as any);
      } finally {
        // Reset navigation flag after a short delay
        setTimeout(() => setIsNavigating(false), 100);
      }
    };

    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      if (!inAuthGroup) {
        navigate('/(auth)/login');
      }
    } else {
      // Authenticated
      if (!hasCompleteAcademicInfo) {
        // Authenticated but no academic info - redirect to onboarding
        if (!inOnboardingGroup) {
          navigate('/(onboarding)/course-selection');
        }
      } else {
        // Authenticated and has academic info - redirect to main app
        if (inAuthGroup || inOnboardingGroup) {
          navigate('/(tabs)/home');
        }
      }
    }
  }, [isLoading, isAuthenticated, hasCompleteAcademicInfo, segments, isNavigating]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(onboarding)" />
    </Stack>
  );
}

// Root component with AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}