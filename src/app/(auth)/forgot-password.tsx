// forgot-password.tsx - Enhanced version with improved UX
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleResetPassword = async (isResend = false) => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.requestPasswordReset({
        email: email.trim().toLowerCase()
      });

      if (response.success) {
        // Store email for the reset confirmation step
        await AsyncStorage.setItem('reset_password_email', email.trim().toLowerCase());

        setEmailSent(true);
        if (isResend) {
          setResendCooldown(60); // 60 second cooldown
          Alert.alert(
            'Code Resent!',
            'A new reset code has been sent to your email.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Reset Code Sent!',
            'Please check your email for a password reset code. It may take a few minutes to arrive.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to new password screen or OTP verification
                  router.push('/(auth)/verify-reset-code');
                },
              },
            ]
          );
        }
      } else {
        throw new Error(response.message || 'Failed to send reset code');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send reset code. Please try again.';

      if (error.message?.toLowerCase().includes('not found') ||
        error.message?.toLowerCase().includes('does not exist')) {
        errorMessage = 'No account found with this email address. Please check your email or create a new account.';
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendCooldown > 0) {
      Alert.alert('Wait', `Please wait ${resendCooldown} seconds before requesting another code.`);
      return;
    }
    handleResetPassword(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          className="flex-1 px-6 pt-12"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6 w-10 h-10 items-center justify-center"
            style={{ marginTop: Platform.OS === 'ios' ? 20 : 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Animated Icon */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-4">
              <Ionicons
                name={emailSent ? "mail-open-outline" : "lock-closed-outline"}
                size={32}
                color="#059669"
              />
            </View>
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
              {emailSent ? 'Check Your Email' : 'Forgot Password?'}
            </Text>
            <Text className="text-gray-600 text-base leading-6 text-center px-4">
              {emailSent
                ? `We've sent a verification code to ${email}. Please check your inbox and spam folder.`
                : "Don't worry! Enter your email address and we'll send you a code to reset your password."
              }
            </Text>
          </View>

          {/* Form */}
          {!emailSent ? (
            <View className="mb-8">
              {/* Email Input */}
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-3">Email Address</Text>
                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border border-gray-200 focus:border-emerald-500">
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={(text) => setEmail(text.trim())}
                    className="flex-1 ml-3 text-gray-800 text-base"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    autoFocus
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Send Code Button */}
              <TouchableOpacity
                onPress={() => handleResetPassword(false)}
                disabled={isLoading || !email.trim()}
                className={`rounded-2xl py-4 flex-row items-center justify-center shadow-sm ${isLoading || !email.trim()
                  ? 'bg-gray-300'
                  : 'bg-emerald-500 shadow-emerald-500/25'
                  }`}
                style={{
                  elevation: isLoading || !email.trim() ? 0 : 3,
                }}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <Text className="text-white text-center font-semibold text-lg mr-2">
                      Sending...
                    </Text>
                    <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </View>
                ) : (
                  <>
                    <Text className="text-white text-center font-semibold text-lg mr-2">
                      Send Reset Code
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // Email sent state
            <View className="mb-8">
              {/* Action Buttons */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/verify-reset-code')}
                className="rounded-2xl py-4 bg-emerald-500 mb-4 shadow-sm shadow-emerald-500/25"
                style={{ elevation: 3 }}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Continue to Verification
                </Text>
              </TouchableOpacity>

              {/* Resend Code Button */}
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={resendCooldown > 0 || isLoading}
                className={`rounded-2xl py-4 border-2 ${resendCooldown > 0 || isLoading
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-emerald-500 bg-white'
                  }`}
              >
                <Text className={`text-center font-semibold text-lg ${resendCooldown > 0 || isLoading ? 'text-gray-400' : 'text-emerald-500'
                  }`}>
                  {resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : isLoading
                      ? 'Sending...'
                      : 'Resend Code'
                  }
                </Text>
              </TouchableOpacity>

              {/* Change Email */}
              <TouchableOpacity
                onPress={() => setEmailSent(false)}
                className="mt-4"
              >
                <Text className="text-center text-gray-600 font-medium">
                  Use different email?
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Remember Password Link */}
          <View className="flex-row justify-center items-center mb-8">
            <Text className="text-gray-600">Remember your password? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-emerald-500 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-800 font-medium mb-1">Need Help?</Text>
                <Text className="text-blue-700 text-sm leading-5">
                  If you don't receive the email within a few minutes, check your spam folder or try again with a different email address.
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}