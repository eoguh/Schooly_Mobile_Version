import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView className="px-6 pt-6">
        {/* User Info */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-emerald-500 items-center justify-center mb-4">
            <Text className="text-white font-bold text-3xl">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 capitalize">{user?.username}</Text>
          <Text className="text-gray-600">{user?.email}</Text>
        </View>

        {/* Settings List */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <Ionicons name="settings-outline" size={20} color="#374151" />
            <Text className="ml-3 text-gray-800 font-medium">Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <Ionicons name="notifications-outline" size={20} color="#374151" />
            <Text className="ml-3 text-gray-800 font-medium">Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center py-4">
            <Ionicons name="help-circle-outline" size={20} color="#374151" />
            <Text className="ml-3 text-gray-800 font-medium">Help & Support</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={logout}
          className="bg-red-500 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
