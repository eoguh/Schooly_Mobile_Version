// verify-reset-code.tsx - OTP verification for password reset
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyResetCodeScreen() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Load email from storage
    loadStoredEmail();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Auto focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
  }, []);

  useEffect(() => {
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

  const loadStoredEmail = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('reset_password_email');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // If no email found, go back to forgot password
        Alert.alert(
          'Error',
          'No email found. Please start the password reset process again.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
        );
      }
    } catch (error) {
      console.error('Error loading email:', error);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all fields are filled
    if (newCode.every(digit => digit !== '') && value !== '') {
      setTimeout(() => handleVerifyCode(newCode.join('')), 100);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code.join('');

    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter all 6 digits');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please restart the process.');
      return;
    }

    setIsLoading(true);

    try {
      // Store the code temporarily for the new password screen
      await AsyncStorage.setItem('reset_code', verificationCode);

      // Navigate to new password screen
      router.push('/(auth)/new-password');

    } catch (error: any) {
      console.error('Code verification error:', error);

      let errorMessage = 'Invalid verification code. Please try again.';
      if (error.message?.toLowerCase().includes('expired')) {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      Alert.alert('Verification Failed', errorMessage);

      // Clear the code inputs
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      Alert.alert('Wait', `Please wait ${resendCooldown} seconds before requesting another code.`);
      return;
    }

    try {
      setIsLoading(true);
      // Call the forgot password API again
      const { apiService } = require('@/services/api');
      const response = await apiService.requestPasswordReset({ email });

      if (response.success) {
        setResendCooldown(60);
        Alert.alert('Code Resent!', 'A new verification code has been sent to your email.');
        // Clear current code
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        throw new Error(response.message || 'Failed to resend code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2
      ? `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}`
      : `${username.charAt(0)}*`;
    return `${maskedUsername}@${domain}`;
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

          {/* Icon */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="mail-open-outline" size={32} color="#3B82F6" />
            </View>
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Enter Verification Code
            </Text>
            <Text className="text-gray-600 text-base leading-6 text-center px-4">
              We've sent a 6-digit code to{'\n'}
              <Text className="font-semibold text-gray-800">{maskEmail(email)}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View className="mb-8">
            <View className="flex-row justify-center gap-x-3 mb-6">
              {code.map((digit, index) => (
                <View
                  key={index}
                  className={`w-12 h-14 border-2 rounded-xl items-center justify-center ${digit
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 bg-white'
                    }`}
                >
                  <TextInput
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                    className="text-xl font-bold text-gray-800 text-center w-full h-full"
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isLoading}
                  />
                </View>
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={() => handleVerifyCode()}
              disabled={isLoading || code.some(digit => !digit)}
              className={`rounded-2xl py-4 flex-row items-center justify-center shadow-sm ${isLoading || code.some(digit => !digit)
                ? 'bg-gray-300'
                : 'bg-emerald-500 shadow-emerald-500/25'
                }`}
              style={{
                elevation: isLoading || code.some(digit => !digit) ? 0 : 3,
              }}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <Text className="text-white text-center font-semibold text-lg mr-2">
                    Verifying...
                  </Text>
                  <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </View>
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Verify Code
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Resend Code */}
          <View className="items-center mb-8">
            <Text className="text-gray-600 mb-3">Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resendCooldown > 0 || isLoading}
            >
              <Text className={`font-semibold text-base ${resendCooldown > 0 || isLoading ? 'text-gray-400' : 'text-emerald-500'
                }`}>
                {resendCooldown > 0
                  ? `Resend Code (${resendCooldown}s)`
                  : 'Resend Code'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <View className="flex-row items-start">
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <View className="flex-1 ml-3">
                <Text className="text-amber-800 font-medium mb-1">Code Expires Soon</Text>
                <Text className="text-amber-700 text-sm leading-5">
                  Your verification code will expire in 10 minutes. If it expires, you'll need to request a new one.
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}