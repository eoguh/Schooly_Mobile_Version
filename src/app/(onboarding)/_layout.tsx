// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/context/OnboardingContext';

export default function OnboardingLayout() {
  // Remove the redirect logic from here since main _layout handles it
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="course-selection" />
      </Stack>
    </OnboardingProvider>
  );
}