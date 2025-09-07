import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Animated } from "react-native";
import ProgressHeader from "@/components/ProgressHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useOnboarding } from "@/context/OnboardingContext";
import { Ionicons } from '@expo/vector-icons';

interface Goal {
  id: string;
  label: string;
  intensity: string;
  minutes: number;
  description: string;
  icon: string;
  color: string;
  recommendation: string;
}

const goals: Goal[] = [
  {
    id: "15",
    label: "15 mins / day",
    intensity: "Light",
    minutes: 15,
    description: "Perfect for busy schedules and building habits",
    icon: "🌱",
    color: "#10B981",
    recommendation: "Great for beginners"
  },
  {
    id: "30",
    label: "30 mins / day",
    intensity: "Casual",
    minutes: 30,
    description: "Balanced approach for consistent learning",
    icon: "☕",
    color: "#3B82F6",
    recommendation: "Most popular choice"
  },
  {
    id: "60",
    label: "1 hr / day",
    intensity: "Regular",
    minutes: 60,
    description: "Dedicated time for serious skill development",
    icon: "📚",
    color: "#8B5CF6",
    recommendation: "For committed learners"
  },
  {
    id: "120",
    label: "2 hrs / day",
    intensity: "Serious",
    minutes: 120,
    description: "Intensive learning for rapid progress",
    icon: "🔥",
    color: "#F59E0B",
    recommendation: "High dedication required"
  },
  {
    id: "240",
    label: "4+ hrs / day",
    intensity: "Intense",
    minutes: 240,
    description: "Full immersion for accelerated mastery",
    icon: "🚀",
    color: "#EF4444",
    recommendation: "For full-time learners"
  },
];

const getEstimatedProgress = (minutes: number) => {
  if (minutes <= 15) return "1-2 topics per week";
  if (minutes <= 30) return "3-4 topics per week";
  if (minutes <= 60) return "1 chapter per week";
  if (minutes <= 120) return "2-3 chapters per week";
  return "1+ subjects per week";
};

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'Light': return '#10B981';
    case 'Casual': return '#3B82F6';
    case 'Regular': return '#8B5CF6';
    case 'Serious': return '#F59E0B';
    case 'Intense': return '#EF4444';
    default: return '#6B7280';
  }
};

export default function DailyGoalsScreen() {
  const [selected, setSelected] = useState("30");
  const { updateData } = useOnboarding();

  const handleNext = () => {
    const selectedGoal = goals.find(goal => goal.id === selected);
    if (selectedGoal) {
      updateData({ daily_attention_target: selectedGoal.minutes });
      router.push("/(onboarding)/course-outline");
    }
  };

  const handleBack = () => router.back();

  const GoalCard = ({ goal, index }: { goal: Goal; index: number }) => {
    const isSelected = selected === goal.id;
    const scaleValue = new Animated.Value(1);

    const handlePress = () => {
      // Animated feedback
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setSelected(goal.id);
    };

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          opacity: 1,
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          className={`p-6 rounded-2xl mb-4 border-2 shadow-sm transition-all duration-200 ${isSelected
            ? 'bg-emerald-50 border-emerald-500 shadow-emerald-500/20'
            : 'bg-white border-gray-200'
            }`}
          style={isSelected ? { elevation: 4 } : { elevation: 2 }}
        >
          {/* Recommendation Badge */}
          {goal.recommendation === "Most popular choice" && (
            <View className="absolute -top-2 -right-2 bg-emerald-500 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-bold">POPULAR</Text>
            </View>
          )}

          <View className="flex-row items-center mb-3">
            <View
              className="w-16 h-16 rounded-2xl justify-center items-center mr-4 shadow-sm"
              style={{
                backgroundColor: goal.color + '15',
                borderColor: goal.color + '30',
                borderWidth: 1
              }}
            >
              <Text className="text-2xl">{goal.icon}</Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className={`text-xl font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                  {goal.label}
                </Text>

                <View
                  className="ml-3 px-3 py-1 rounded-full"
                  style={{ backgroundColor: getIntensityColor(goal.intensity) + '20' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: getIntensityColor(goal.intensity) }}
                  >
                    {goal.intensity}
                  </Text>
                </View>
              </View>

              <Text className={`text-sm mb-2 ${isSelected ? 'text-gray-700' : 'text-gray-600'
                }`}>
                {goal.description}
              </Text>

              <Text className={`text-xs font-medium ${isSelected ? 'text-emerald-600' : 'text-gray-500'
                }`}>
                {goal.recommendation}
              </Text>
            </View>

            <View className={`w-7 h-7 rounded-full border-2 justify-center items-center transition-all duration-200 ${isSelected
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300'
              }`}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>

          {/* Progress Estimation */}
          <View className={`flex-row items-center mt-2 pt-3 border-t ${isSelected ? 'border-emerald-200' : 'border-gray-200'
            }`}>
            <Ionicons
              name="trending-up-outline"
              size={16}
              color={isSelected ? '#059669' : '#9CA3AF'}
            />
            <Text className={`text-sm font-medium ml-2 ${isSelected ? 'text-emerald-700' : 'text-gray-600'
              }`}>
              Expected progress: {getEstimatedProgress(goal.minutes)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const selectedGoal = goals.find(g => g.id === selected);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ProgressHeader
        step={4}
        totalSteps={5}
        handleBack={handleBack}
        handleNext={handleNext}
        nextDisabled={!selected}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-black text-gray-900 mb-3">
            Daily Learning Goal
          </Text>
          <Text className="text-lg text-gray-600 leading-relaxed">
            How much time can you dedicate to learning each day?
          </Text>
        </View>

        {/* Goal Recommendation Card */}
        <View className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-200">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bulb-outline" size={24} color="#3B82F6" />
            <Text className="text-blue-700 font-bold text-lg ml-2">
              Smart Recommendation
            </Text>
          </View>
          <Text className="text-blue-600 leading-relaxed">
            Research shows that <Text className="font-bold">30 minutes daily</Text> is the sweet spot for
            building lasting learning habits while seeing consistent progress.
          </Text>
        </View>

        {/* Goals List */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Choose Your Commitment Level
          </Text>

          {goals.map((goal, index) => (
            <GoalCard key={goal.id} goal={goal} index={index} />
          ))}
        </View>

        {/* Selected Goal Summary */}
        {selectedGoal && (
          <View className="mt-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text className="text-emerald-700 font-semibold ml-2">Your Daily Goal</Text>
            </View>

            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-3">{selectedGoal.icon}</Text>
              <View className="flex-1">
                <Text className="text-emerald-800 font-bold text-lg">
                  {selectedGoal.label}
                </Text>
                <Text className="text-emerald-600 text-sm">
                  {selectedGoal.intensity} intensity level
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-emerald-200">
              <Text className="text-emerald-700 font-semibold mb-2">What to expect:</Text>
              <View className="space-y-1">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#059669" />
                  <Text className="text-emerald-600 text-sm ml-2">
                    {selectedGoal.minutes} minutes daily commitment
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="trending-up-outline" size={16} color="#059669" />
                  <Text className="text-emerald-600 text-sm ml-2">
                    {getEstimatedProgress(selectedGoal.minutes)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={16} color="#059669" />
                  <Text className="text-emerald-600 text-sm ml-2">
                    ~{Math.round(selectedGoal.minutes * 7 / 60)} hours per week
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Tips Section */}
        <View className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <View className="flex-row items-start">
            <Ionicons name="star-outline" size={20} color="#F59E0B" className="mt-0.5" />
            <View className="flex-1 ml-3">
              <Text className="text-amber-700 font-semibold mb-2">Success Tips</Text>
              <Text className="text-amber-600 text-sm leading-relaxed">
                • Start with a realistic goal you can maintain consistently
                {'\n'}• You can always adjust your goal later in settings
                {'\n'}• Quality matters more than quantity - stay focused during your study time
                {'\n'}• Take breaks every 25-30 minutes to maintain concentration
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}