// new-password.tsx - Enhanced version with better UX and API integration
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

export default function NewPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [strengthAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Load stored data
    loadStoredData();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Animate strength indicator
    const strength = getPasswordStrength(password);
    Animated.timing(strengthAnim, {
      toValue: strength.score / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [password]);

  const loadStoredData = async () => {
    try {
      const [storedEmail, storedCode] = await AsyncStorage.multiGet([
        'reset_password_email',
        'reset_code'
      ]);

      const emailValue = storedEmail[1];
      const codeValue = storedCode[1];

      if (!emailValue || !codeValue) {
        Alert.alert(
          'Error',
          'Session expired. Please start the password reset process again.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
        );
        return;
      }

      setEmail(emailValue);
      setResetCode(codeValue);
    } catch (error) {
      console.error('Error loading stored data:', error);
      router.replace('/(auth)/forgot-password');
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '#E5E7EB', bgColor: '#F9FAFB' };

    const validation = validatePassword(password);
    const checks = [
      validation.minLength,
      validation.hasUpperCase,
      validation.hasLowerCase,
      validation.hasNumbers,
      validation.hasSpecialChar
    ];

    const score = checks.filter(Boolean).length;

    if (score <= 1) {
      return { score: 1, label: 'Very Weak', color: '#EF4444', bgColor: '#FEF2F2' };
    } else if (score === 2) {
      return { score: 2, label: 'Weak', color: '#F97316', bgColor: '#FFF7ED' };
    } else if (score === 3) {
      return { score: 3, label: 'Fair', color: '#EAB308', bgColor: '#FEFCE8' };
    } else if (score === 4) {
      return { score: 4, label: 'Good', color: '#22C55E', bgColor: '#F0FDF4' };
    } else {
      return { score: 5, label: 'Excellent', color: '#059669', bgColor: '#ECFDF5' };
    }
  };

  const passwordValidation = validatePassword(password);
  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!passwordValidation.isValid) {
      Alert.alert('Weak Password', 'Please ensure your password meets all security requirements');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please check and try again.');
      return;
    }

    if (!email || !resetCode) {
      Alert.alert('Error', 'Session expired. Please start the password reset process again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.confirmPasswordReset({
        email,
        otp: resetCode,
        new_password: password,
        confirm_new_password: confirmPassword
      });

      if (response.success) {
        // Clear stored data
        await AsyncStorage.multiRemove(['reset_password_email', 'reset_code']);

        Alert.alert(
          'Password Updated!',
          'Your password has been successfully updated. You can now sign in with your new password.',
          [
            {
              text: 'Sign In Now',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to update password');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to update password. Please try again.';

      if (error.message?.toLowerCase().includes('expired') ||
        error.message?.toLowerCase().includes('invalid')) {
        errorMessage = 'Your reset code has expired or is invalid. Please start the password reset process again.';
        // Clear stored data and redirect
        await AsyncStorage.multiRemove(['reset_password_email', 'reset_code']);
        setTimeout(() => {
          router.replace('/(auth)/forgot-password');
        }, 2000);
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Reset Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <View className="flex-row items-center mb-2">
      <View className={`w-5 h-5 rounded-full mr-3 justify-center items-center ${met ? 'bg-emerald-500' : 'bg-gray-300'
        }`}>
        {met && <Ionicons name="checkmark" size={12} color="white" />}
      </View>
      <Text className={`text-sm ${met ? 'text-gray-700' : 'text-gray-500'}`}>
        {text}
      </Text>
    </View>
  );

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
            <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="lock-closed" size={32} color="#059669" />
            </View>
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Create New Password
            </Text>
            <Text className="text-gray-600 text-base leading-6 text-center px-4">
              Your new password must be different from your previous password and meet our security requirements.
            </Text>
          </View>

          {/* New Password Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-3">New Password</Text>
            <View className={`flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border-2 ${password && !passwordValidation.isValid ? 'border-red-300' : 'border-gray-200'
              }`}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Enter new password"
                value={password}
                onChangeText={setPassword}
                className="flex-1 ml-3 text-gray-800 text-base"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View className="mt-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600">Password Strength</Text>
                  <Text className={`text-sm font-medium`} style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <Animated.View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: passwordStrength.color,
                      width: strengthAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-3">Confirm New Password</Text>
            <View className={`flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border-2 ${confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-200'
              }`}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                className="flex-1 ml-3 text-gray-800 text-base"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <View className={`mt-2 flex-row items-center ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'
                }`}>
                <Ionicons
                  name={password === confirmPassword ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={password === confirmPassword ? "#059669" : "#EF4444"}
                />
                <Text className={`ml-2 text-sm ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                  {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}
          </View>

          {/* Password Requirements */}
          {password.length > 0 && (
            <View className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <Text className="text-gray-700 font-medium mb-3">Security Requirements</Text>
              <PasswordRequirement
                met={passwordValidation.minLength}
                text="At least 8 characters"
              />
              <PasswordRequirement
                met={passwordValidation.hasUpperCase}
                text="One uppercase letter (A-Z)"
              />
              <PasswordRequirement
                met={passwordValidation.hasLowerCase}
                text="One lowercase letter (a-z)"
              />
              <PasswordRequirement
                met={passwordValidation.hasNumbers}
                text="One number (0-9)"
              />
              <PasswordRequirement
                met={passwordValidation.hasSpecialChar}
                text="One special character (!@#$%^&*)"
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
            className={`rounded-2xl py-4 shadow-sm ${isLoading || !passwordValidation.isValid || password !== confirmPassword
                ? 'bg-gray-300'
                : 'bg-emerald-500 shadow-emerald-500/25'
              }`}
            style={{
              elevation: isLoading || !passwordValidation.isValid || password !== confirmPassword ? 0 : 3,
            }}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <Text className="text-white text-center font-semibold text-lg mr-2">
                  Updating Password...
                </Text>
                <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </View>
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Update Password
              </Text>
            )}
          </TouchableOpacity>

          {/* Security Tips */}
          <View className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-800 font-medium mb-2">Password Security Tips</Text>
                <Text className="text-blue-700 text-sm leading-5 mb-1">
                  • Use a unique password you haven't used elsewhere
                </Text>
                <Text className="text-blue-700 text-sm leading-5 mb-1">
                  • Consider using a password manager
                </Text>
                <Text className="text-blue-700 text-sm leading-5">
                  • Keep your password private and secure
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}