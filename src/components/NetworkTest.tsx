// components/NetworkTest.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { apiService } from '@/services/api';

export default function NetworkTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus(null);
    
    try {
      const response = await apiService.testConnection();
      if (response.success) {
        setConnectionStatus('✅ Connection successful');
        Alert.alert('Success', 'Successfully connected to the server!');
      } else {
        setConnectionStatus(`❌ Connection failed: ${response.message}`);
        Alert.alert('Error', response.message || 'Connection failed');
      }
    } catch (error: any) {
      setConnectionStatus(`❌ Connection error: ${error.message}`);
      Alert.alert('Error', error.message || 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificEndpoint = async () => {
    setIsLoading(true);
    
    try {
      // Test the register endpoint with a dummy request to see the response
      const testData = {
        email: 'test@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'testpass123'
      };
      
      const response = await apiService.register(testData);
      console.log('Register endpoint response:', response);
      
      Alert.alert(
        'Endpoint Test', 
        `Register endpoint responded with: ${response.success ? 'Success' : 'Error: ' + response.message}`
      );
    } catch (error: any) {
      console.error('Endpoint test error:', error);
      Alert.alert('Endpoint Test Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="p-4 m-4 bg-gray-100 rounded-lg">
      <Text className="text-lg font-bold mb-4">Network Test</Text>
      
      {connectionStatus && (
        <Text className="mb-4 text-sm">{connectionStatus}</Text>
      )}
      
      <TouchableOpacity
        onPress={testConnection}
        disabled={isLoading}
        className={`p-3 rounded-lg mb-2 ${isLoading ? 'bg-gray-400' : 'bg-blue-500'}`}
      >
        <Text className="text-white text-center">
          {isLoading ? 'Testing...' : 'Test Base Connection'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={testSpecificEndpoint}
        disabled={isLoading}
        className={`p-3 rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-green-500'}`}
      >
        <Text className="text-white text-center">
          {isLoading ? 'Testing...' : 'Test Register Endpoint'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}