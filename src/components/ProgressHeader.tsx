import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProgressHeader({
  handleBack,
  handleNext,
  step,
  totalSteps,
  nextDisabled
}: {
  handleBack: () => void;
  handleNext: () => void;
  step: number;
  totalSteps: number;
  nextDisabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between mb-6 pt-6 px-4">
      <TouchableOpacity onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>

      {/* Progress bar */}
      <View className="flex-row items-center">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            className={`w-8 h-1 rounded-full mr-1 ${i < step ? "bg-[#00B77F]" : "bg-gray-200"
              }`}
          />
        ))}
      </View>

      <TouchableOpacity onPress={handleNext}>
        <Text className="text-[#00B77F] font-semibold text-base">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
