import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  size = 'md',
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-10 h-10';
      case 'lg':
        return 'w-14 h-14';
      default:
        return 'w-12 h-12';
    }
  };

  const getProviderStyles = () => {
    switch (provider) {
      case 'google':
        return 'bg-red-500';
      case 'apple':
        return 'bg-black';
      case 'facebook':
        return 'bg-blue-600';
      default:
        return 'bg-gray-500';
    }
  };

  const renderIcon = () => {
    switch (provider) {
      case 'google':
        return <Text className="text-white font-bold text-lg">G</Text>;
      case 'apple':
        return <Ionicons name="logo-apple" size={24} color="white" />;
      case 'facebook':
        return <Text className="text-white font-bold text-lg">f</Text>;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`
        ${getSizeStyles()}
        ${getProviderStyles()}
        rounded-full items-center justify-center
      `}
    >
      {renderIcon()}
    </TouchableOpacity>
  );
};