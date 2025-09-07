import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import ProgressHeader from "@/components/ProgressHeader";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useState, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';

interface UserAcademicInfo {
  id: number;
  course_of_study: string;
  level_of_study: string;
  subjects: string;
  daily_attention_target: number;
  user: number;
}

export default function CourseOutlineScreen() {
  const { saveAcademicInfo, isLoading } = useAuth();
  const { data: onboardingData, resetData, isComplete } = useOnboarding();
  const [academicInfo, setAcademicInfo] = useState<UserAcademicInfo | null>(null);
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    resetData(); // Clear onboarding data
    router.replace("/(tabs)/home");
  };

  const handleBack = () => router.back();

  useEffect(() => {
    // Validate that we have complete onboarding data
    if (!isComplete) {
      console.error('⚠️ Incomplete onboarding data:', onboardingData);
      Alert.alert(
        'Incomplete Data',
        'Please complete all previous steps.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    saveAcademicInfoAndGetResponse();
  }, []);

  const saveAcademicInfoAndGetResponse = async () => {
    try {
      setSaving(true);

      // Save the academic info and get the response
      const response = await saveAcademicInfo({
        course_of_study: onboardingData.course_of_study,
        subjects: onboardingData.subjects,
        level_of_study: onboardingData.level_of_study,
        daily_attention_target: onboardingData.daily_attention_target,
      });

      setAcademicInfo(response);

    } catch (error: any) {
      console.error('❌ Error saving academic info:', error);

      Alert.alert(
        'Error',
        'Failed to save your information. Please try again.',
        [
          {
            text: 'Retry',
            onPress: saveAcademicInfoAndGetResponse
          },
          {
            text: 'Go Back',
            onPress: () => router.back(),
            style: 'cancel'
          }
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  if (saving || isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ProgressHeader step={5} totalSteps={5} handleBack={handleBack} handleNext={() => { }} />

        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <ActivityIndicator size="large" color="#10B981" className="mb-4" />
            <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
              Setting up your learning profile
            </Text>
            <Text className="text-gray-500 text-center leading-relaxed">
              We're saving your preferences and creating your personalized learning experience
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const getSubjectIcon = (subject: string) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('math')) return '📊';
    if (subjectLower.includes('english')) return '🇬🇧';
    if (subjectLower.includes('physics')) return '⚛️';
    if (subjectLower.includes('chemistry')) return '🧪';
    if (subjectLower.includes('biology')) return '🧬';
    if (subjectLower.includes('computer') || subjectLower.includes('programming')) return '💻';
    if (subjectLower.includes('design')) return '🎨';
    if (subjectLower.includes('drawing')) return '📐';
    if (subjectLower.includes('studies')) return '📚';
    return '📖';
  };

  const getLevelBadgeColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower.includes('beginner') || levelLower.includes('basic')) return 'bg-green-100 text-green-800 border-green-200';
    if (levelLower.includes('intermediate') || levelLower.includes('medium')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (levelLower.includes('advanced') || levelLower.includes('expert')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDailyGoalIcon = (minutes: number) => {
    if (minutes <= 30) return '⏰';
    if (minutes <= 60) return '⏱️';
    return '🕐';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ProgressHeader step={5} totalSteps={5} handleBack={handleBack} handleNext={handleNext} />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 bg-emerald-100 rounded-2xl items-center justify-center mr-4">
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                Setup Complete!
              </Text>
              <Text className="text-gray-600">
                Your learning profile has been created
              </Text>
            </View>
          </View>
        </View>

        {academicInfo && (
          <>
            {/* Course Overview Card */}
            <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Text className="text-3xl mr-3">{getSubjectIcon(academicInfo.subjects)}</Text>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {academicInfo.course_of_study}
                  </Text>
                  <Text className="text-gray-600">
                    {academicInfo.subjects} • {academicInfo.level_of_study}
                  </Text>
                </View>
              </View>

              <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{getDailyGoalIcon(academicInfo.daily_attention_target)}</Text>
                  <View className="flex-1">
                    <Text className="text-emerald-800 font-semibold text-lg">
                      {academicInfo.daily_attention_target} minutes daily
                    </Text>
                    <Text className="text-emerald-600 text-sm">
                      Your personalized learning commitment
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Learning Profile Details */}
            <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100 shadow-sm">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Your Learning Profile
              </Text>

              {/* Course of Study */}
              <View className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="school-outline" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm">Course of Study</Text>
                  <Text className="text-gray-900 font-medium">
                    {academicInfo.course_of_study}
                  </Text>
                </View>
              </View>

              {/* Level of Study */}
              <View className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="bar-chart-outline" size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm">Study Level</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-gray-900 font-medium mr-2">
                      {academicInfo.level_of_study}
                    </Text>
                    <View className={`px-2 py-1 rounded-full border ${getLevelBadgeColor(academicInfo.level_of_study)}`}>
                      <Text className="text-xs font-medium">
                        {academicInfo.level_of_study}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Subject Focus */}
              <View className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="library-outline" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm">Primary Subject</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-2xl mr-2">{getSubjectIcon(academicInfo.subjects)}</Text>
                    <Text className="text-gray-900 font-medium">
                      {academicInfo.subjects}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Daily Commitment */}
              <View className="flex-row items-center py-3">
                <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="time-outline" size={20} color="#F97316" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm">Daily Learning Goal</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-gray-900 font-medium">
                      {academicInfo.daily_attention_target} minutes per day
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* What's Next Card */}
            <View className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 mb-6">
              <View className="flex-row items-start">
                <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-4">
                  <Ionicons name="rocket-outline" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg mb-2">
                    Ready to Start Learning?
                  </Text>
                  <Text className="text-emerald-100 text-sm leading-relaxed">
                    Your personalized learning experience is ready. We'll help you stay on track with your {academicInfo.daily_attention_target}-minute daily goal and provide tailored content for {academicInfo.subjects}.
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={saving}
          className="bg-emerald-500 py-4 rounded-2xl shadow-sm border border-emerald-400 active:bg-emerald-600"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="arrow-forward" size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">
              {saving ? 'Setting up...' : 'Start Learning Journey'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Footer Note */}
        <View className="mt-6 p-4 bg-gray-100 rounded-2xl">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" className="mt-0.5 mr-2" />
            <Text className="text-gray-600 text-xs leading-relaxed flex-1">
              You can always update your learning preferences and daily goals from your profile settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}