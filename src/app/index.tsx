import { useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export default function SplashScreen() {
  useEffect(() => {
    // Auto-navigate to login after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <StatusBar animated barStyle="light-content" />

      {/* Logo/Icon */}
      <View className="w-28 h-28 items-center justify-center mb-6">
        <View className="w-24 h-24 items-center justify-center">
          <Image
            source={require("../assets/images/logo.png")}
            style={{ width: 150, height: 150 }}
            contentFit='contain'
            className="mb-6"
          />
        </View>
      </View>

      {/* App Name */}
      <Text style={{ fontFamily: "DMSans_400Regular" }} className="text-3xl font-semibold text-gray-800">Schooler</Text>
    </View>
  );
}