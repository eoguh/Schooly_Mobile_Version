import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 border border-gray-300';
      case 'outline':
        return 'bg-transparent border border-emerald-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4';
      case 'lg':
        return 'py-5 px-6';
      default:
        return 'py-4 px-5';
    }
  };

  const getTextStyles = () => {
    if (variant === 'outline') return 'text-emerald-500 font-semibold';
    if (variant === 'secondary') return 'text-gray-700 font-semibold';
    return 'text-white font-semibold';
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        rounded-lg items-center justify-center
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? 'white' : '#10B981'}
          size="small"
        />
      ) : (
        <Text className={`${getTextStyles()} text-lg`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
