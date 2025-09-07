// otp-verification.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OTPVerificationScreen() {
  const { verifyOTP, resendOTP } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get the email from AsyncStorage (stored during registration or login redirect)
    const getStoredEmail = async () => {
      try {
        const email = await AsyncStorage.getItem('pending_verification_email');
        if (email) {
          setUserEmail(email);
        }
      } catch (error) {
        console.error('Error getting stored email:', error);
      }
    };

    getStoredEmail();

    // Start timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      shakeInputs();
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    if (!userEmail) {
      Alert.alert('Error', 'Email not found. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(userEmail, otpCode);

      Alert.alert(
        'Verification Successful!',
        'Your account has been verified. You can now login.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      shakeInputs();
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Verification Failed', error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || !userEmail) return;

    setIsLoading(true);
    try {
      await resendOTP(userEmail);

      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      Alert.alert('Code Sent!', 'A new verification code has been sent to your email.');

      // Restart timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (username.length <= 3) {
      return `${username[0]}***@${domain}`;
    }
    return `${username.substring(0, 3)}***@${domain}`;
  };

  const getInputStyle = (index: number, digit: string) => {
    const isFocused = focusedIndex === index;
    const hasValue = digit !== '';

    return {
      borderColor: isFocused ? '#059669' : (hasValue ? '#059669' : '#E5E7EB'),
      borderWidth: isFocused ? 3 : 2,
      backgroundColor: hasValue ? '#F0FDF4' : (isFocused ? '#F0FDF4' : '#FFFFFF'),
      transform: [{ scale: isFocused ? 1.05 : 1 }],
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
          {/* Enhanced Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8 w-12 h-12 bg-gray-50 rounded-xl items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Enhanced Header */}
          <View className="mb-10 items-center">
            <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="mail-outline" size={40} color="#059669" />
            </View>

            <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Verify Your Email
            </Text>

            <Text className="text-base text-gray-600 text-center leading-relaxed px-4">
              We've sent a 6-digit verification code to
            </Text>

            <View className="mt-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <Text className="font-bold text-emerald-700 text-center">
                {maskEmail(userEmail)}
              </Text>
            </View>

            <Text className="text-sm text-gray-500 text-center mt-2">
              Please check your inbox and enter the code below
            </Text>
          </View>

          {/* Enhanced OTP Input Fields */}
          <Animated.View
            className="mb-8"
            style={{ transform: [{ translateX: shakeAnimation }] }}
          >
            <View className="flex-row justify-between px-2 mb-6">
              {otp.map((digit, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={1}
                  onPress={() => inputRefs.current[index]?.focus()}
                >
                  <Animated.View
                    className="w-14 h-16 rounded-xl justify-center items-center shadow-sm"
                    style={[
                      getInputStyle(index, digit),
                      { elevation: focusedIndex === index ? 4 : 2 }
                    ]}
                  >
                    <TextInput
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      className="text-2xl font-bold text-gray-900 text-center w-full"
                      maxLength={1}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      textAlign="center"
                    />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Enhanced Timer and Resend Section */}
            <View className="items-center">
              <View className="flex-row items-center justify-center mb-2">
                <Ionicons
                  name={canResend ? "refresh-outline" : "time-outline"}
                  size={16}
                  color={canResend ? "#059669" : "#9CA3AF"}
                />
                <Text className="text-gray-600 text-sm ml-1">
                  {canResend ? "Ready to resend" : `Resend in ${formatTime(timer)}`}
                </Text>
              </View>

              {canResend && (
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={isLoading}
                  className="px-6 py-2 bg-emerald-50 rounded-lg border border-emerald-200"
                  activeOpacity={0.8}
                >
                  <Text className="text-emerald-600 font-bold text-sm">
                    Resend Code
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Enhanced Continue Button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
            activeOpacity={0.9}
            className={`rounded-xl py-4 shadow-sm mb-6 ${isLoading || otp.join('').length !== 6
                ? 'bg-gray-300'
                : 'bg-emerald-600 shadow-emerald-600/25'
              }`}
            style={!(isLoading || otp.join('').length !== 6) && { elevation: 3 }}
          >
            <View className="flex-row items-center justify-center">
              {isLoading && (
                <View className="mr-2">
                  <Animated.View>
                    <Ionicons name="sync-outline" size={20} color="white" />
                  </Animated.View>
                </View>
              )}
              <Text className="text-white text-center font-bold text-lg mr-2">
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Text>
              {!isLoading && otp.join('').length === 6 && (
                <Ionicons name="arrow-forward" size={20} color="white" />
              )}
            </View>
          </TouchableOpacity>

          {/* Help Section */}
          <View className="items-center mt-4">
            <Text className="text-gray-500 text-sm text-center mb-3">
              Didn't receive the code?
            </Text>

            <View className="flex-row space-x-6">
              <TouchableOpacity
                className="flex-row items-center"
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={16} color="#059669" />
                <Text className="text-emerald-600 font-medium text-sm ml-1">
                  Check Spam
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                activeOpacity={0.7}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back-outline" size={16} color="#059669" />
                <Text className="text-emerald-600 font-medium text-sm ml-1">
                  Change Email
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}