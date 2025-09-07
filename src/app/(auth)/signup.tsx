import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

interface SignUpForm {
  email: string;
  username: string;
  fullname: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpScreen() {
  const { register } = useAuth();
  const [formData, setFormData] = useState<SignUpForm>({
    email: '',
    username: '',
    fullname: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.fullname || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        username: formData.username,
        fullname: formData.fullname,
        password: formData.password,
      });

      Alert.alert(
        'Registration Successful!',
        'Please check your email for the verification code.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(auth)/otp-verification'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Social Login', `${provider} signup would be implemented here`);
  };

  const getInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    const hasValue = formData[fieldName as keyof SignUpForm];

    return {
      borderColor: isFocused ? '#059669' : (hasValue ? '#D1FAE5' : '#E5E7EB'),
      borderWidth: isFocused ? 2 : 1,
      backgroundColor: isFocused ? '#F0FDF4' : (hasValue ? '#FAFAFA' : '#F9FAFB'),
    };
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, color: '#E5E7EB', text: '' };
    if (password.length < 6) return { strength: 1, color: '#EF4444', text: 'Weak' };
    if (password.length < 8) return { strength: 2, color: '#F59E0B', text: 'Fair' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 3, color: '#059669', text: 'Strong' };
    }
    return { strength: 2, color: '#F59E0B', text: 'Good' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
          {/* Enhanced Header */}
          <View className="mb-8">
            <Text className="text-5xl font-black text-gray-900 mb-1">Create</Text>
            <Text className="text-5xl font-black text-gray-900 mb-4">Account</Text>
            <Text className="text-lg text-gray-600 leading-relaxed">
              Join us today and start your journey
            </Text>
          </View>

          {/* Enhanced Form */}
          <View className="mb-6">
            {/* Email Input */}
            <View className="mb-5">
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
                {formData.email && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </View>
            </View>

            {/* Username Input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">
                Username
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-4 transition-all duration-200"
                style={getInputStyle('username')}
              >
                <Ionicons
                  name="at-outline"
                  size={22}
                  color={focusedField === 'username' ? '#059669' : '#9CA3AF'}
                />
                <TextInput
                  placeholder="Choose a username"
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
                {formData.username && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </View>
            </View>

            {/* Full Name Input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">
                Full Name
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-4 transition-all duration-200"
                style={getInputStyle('fullname')}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={focusedField === 'fullname' ? '#059669' : '#9CA3AF'}
                />
                <TextInput
                  placeholder="Enter your full name"
                  value={formData.fullname}
                  onChangeText={(text) => setFormData({ ...formData, fullname: text })}
                  onFocus={() => setFocusedField('fullname')}
                  onBlur={() => setFocusedField(null)}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
                {formData.fullname && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </View>
            </View>

            {/* Password Input with strength indicator */}
            <View className="mb-5">
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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <View className="mt-2 ml-1">
                  <View className="flex-row items-center mb-1">
                    <View className="flex-row space-x-1 flex-1">
                      {[1, 2, 3].map((level) => (
                        <View
                          key={level}
                          className="h-1 flex-1 rounded-full"
                          style={{
                            backgroundColor: level <= passwordStrength.strength ? passwordStrength.color : '#E5E7EB'
                          }}
                        />
                      ))}
                    </View>
                    <Text className="text-xs font-medium ml-2" style={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">
                Confirm Password
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-4 transition-all duration-200"
                style={getInputStyle('confirmPassword')}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={focusedField === 'confirmPassword' ? '#059669' : '#9CA3AF'}
                />
                <TextInput
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showConfirmPassword}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color={focusedField === 'confirmPassword' ? '#059669' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <View className="mt-2 ml-1 flex-row items-center">
                  <Ionicons
                    name={formData.password === formData.confirmPassword ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={formData.password === formData.confirmPassword ? "#059669" : "#EF4444"}
                  />
                  <Text
                    className="text-xs font-medium ml-1"
                    style={{ color: formData.password === formData.confirmPassword ? "#059669" : "#EF4444" }}
                  >
                    {formData.password === formData.confirmPassword ? "Passwords match" : "Passwords don't match"}
                  </Text>
                </View>
              )}
            </View>

            {/* Enhanced Terms Agreement */}
            <View className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <View className="flex-row items-start">
                <Ionicons name="information-circle-outline" size={20} color="#059669" className="mt-0.5" />
                <Text className="text-sm text-gray-700 ml-2 flex-1 leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <Text className="text-emerald-600 font-semibold">Terms of Service</Text>
                  {" "}and{" "}
                  <Text className="text-emerald-600 font-semibold">Privacy Policy</Text>
                </Text>
              </View>
            </View>

            {/* Enhanced Create Account Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.9}
              className={`rounded-xl py-4 mb-6 shadow-sm ${isLoading
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
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Enhanced Social Login Section */}
          <View className="items-center mb-6">
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

          {/* Enhanced Login Link */}
          <View className="flex-row justify-center items-center pb-8">
            <Text className="text-gray-600 text-base">Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text className="text-emerald-600 font-bold text-base">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}