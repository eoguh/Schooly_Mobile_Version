import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { login, resendOTP } = useAuth();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      // Navigation will be handled automatically by the AuthContext when isAuthenticated becomes true
    } catch (error: any) {
      // Check if the error is about email not being verified
      if (error.message && error.message.includes('Email is not verified')) {
        Alert.alert(
          'Email Not Verified',
          'Your email address has not been verified yet. We\'ll send you a new verification code.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Verify Now',
              onPress: async () => {
                try {
                  // Store the email for OTP verification screen
                  await AsyncStorage.setItem('pending_verification_email', formData.email);
                  // Trigger resend OTP automatically
                  await resendOTP(formData.email);
                  // Navigate to OTP screen
                  router.push('/(auth)/otp-verification');
                } catch (resendError: any) {
                  Alert.alert('Error', resendError.message || 'Failed to send verification code');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', error.message || 'Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Social Login', `${provider} login would be implemented here`);
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const getInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    const hasValue = fieldName === 'email' ? formData.email : formData.password;

    return {
      borderColor: isFocused ? '#059669' : (hasValue ? '#D1FAE5' : '#E5E7EB'),
      borderWidth: isFocused ? 2 : 1,
      backgroundColor: isFocused ? '#F0FDF4' : (hasValue ? '#FAFAFA' : '#F9FAFB'),
    };
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 px-6 pt-16">
          {/* Header with improved spacing */}
          <View className="mb-10">
            <Text className="text-5xl font-black text-gray-900 mb-3">Welcome</Text>
            <Text className="text-5xl font-black text-gray-900 mb-4">back</Text>
            <Text className="text-lg text-gray-600 leading-relaxed">
              Sign in to continue your journey
            </Text>
          </View>

          {/* Enhanced Form */}
          <View className="mb-8">
            {/* Email Input with improved focus states */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">
                Email Address
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-4 transition-all duration-200"
                style={getInputStyle('email')}
              >
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={focusedField === 'email' ? '#059669' : '#9CA3AF'}
                />
                <TextInput
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                {formData.email ? (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                ) : null}
              </View>
            </View>

            {/* Password Input with improved focus states */}
            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">
                Password
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-4 transition-all duration-200"
                style={getInputStyle('password')}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={focusedField === 'password' ? '#059669' : '#9CA3AF'}
                />
                <TextInput
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color={focusedField === 'password' ? '#059669' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password with better positioning */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              className="mb-8 self-end"
              activeOpacity={0.7}
            >
              <Text className="text-emerald-600 font-semibold text-base">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Enhanced Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
              className={`rounded-xl py-4 mb-8 shadow-sm ${isLoading
                ? 'bg-emerald-400'
                : 'bg-emerald-600 shadow-emerald-600/25'
                }`}
              style={!isLoading && { elevation: 3 }}
            >
              <View className="flex-row items-center justify-center">
                {isLoading && (
                  <View className="mr-2">
                    <Animated.View>
                      <Ionicons name="sync-outline" size={20} color="white" />
                    </Animated.View>
                  </View>
                )}
                <Text className="text-white text-center font-bold text-lg">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Enhanced Social Login Section */}
          <View className="items-center mb-8">
            <View className="flex-row items-center w-full mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-gray-500 font-medium">Or continue with</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <View className="flex-row justify-center gap-x-3">
              <TouchableOpacity
                onPress={() => handleSocialLogin('Google')}
                activeOpacity={0.8}
                className="w-12 h-12 bg-white border border-gray-200 rounded-xl items-center justify-center shadow-sm"
                style={{ elevation: 2 }}
              >
                <Ionicons name="logo-google" size={20} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSocialLogin('Apple')}
                activeOpacity={0.8}
                className="w-12 h-12 bg-black rounded-xl items-center justify-center shadow-sm"
                style={{ elevation: 2 }}
              >
                <Ionicons name="logo-apple" size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSocialLogin('Facebook')}
                activeOpacity={0.8}
                className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center shadow-sm"
                style={{ elevation: 2 }}
              >
                <Ionicons name="logo-facebook" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Enhanced Sign Up Link */}
          <View className="flex-row justify-center items-center pb-8">
            <Text className="text-gray-600 text-base">Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.7}
            >
              <Text className="text-emerald-600 font-bold text-base">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}