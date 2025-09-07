import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Animated, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProgressHeader from '@/components/ProgressHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/context/OnboardingContext';

interface Level {
  id: string;
  name: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' | 'Flexible';
}

const levels: Level[] = [
  {
    id: '100',
    name: '100 Level',
    description: 'Foundation courses and basic concepts',
    duration: '1st Year',
    icon: '🎯',
    color: '#3B82F6',
    difficulty: 'Beginner'
  },
  {
    id: '200',
    name: '200 Level',
    description: 'Intermediate concepts and practical applications',
    duration: '2nd Year',
    icon: '📚',
    color: '#8B5CF6',
    difficulty: 'Intermediate'
  },
  {
    id: '300',
    name: '300 Level',
    description: 'Advanced topics and specialized knowledge',
    duration: '3rd Year',
    icon: '🎓',
    color: '#10B981',
    difficulty: 'Advanced'
  },
  {
    id: '400',
    name: '400 Level',
    description: 'Expert level and research-oriented studies',
    duration: '4th Year',
    icon: '👑',
    color: '#F59E0B',
    difficulty: 'Expert'
  },
  {
    id: '500',
    name: '500 Level',
    description: 'Master level courses and thesis work',
    duration: '5th Year+',
    icon: '🔬',
    color: '#EF4444',
    difficulty: 'Master'
  },
  {
    id: 'fun',
    name: 'Learning is Fun',
    description: 'Casual learning at your own pace',
    duration: 'Flexible',
    icon: '🎈',
    color: '#EC4899',
    difficulty: 'Flexible'
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return '#10B981';
    case 'Intermediate': return '#F59E0B';
    case 'Advanced': return '#EF4444';
    case 'Expert': return '#8B5CF6';
    case 'Master': return '#DC2626';
    case 'Flexible': return '#EC4899';
    default: return '#6B7280';
  }
};

// Function to generate subjects using OpenAI API
const generateSubjects = async (course: string, level: string) => {
  try {
    const prompt = `Generate 10 relevant academic subjects for a student studying ${course} at ${level}. 
    Return ONLY a JSON array with this exact format, no additional text:
    [
      {
        "id": "subject-slug",
        "name": "Subject Name",
        "description": "Brief description of the subject",
        "icon": "relevant-emoji",
        "color": "#hexcolor",
        "category": "Core|Elective|Practical",
        "difficulty": "Beginner|Intermediate|Advanced"
      }
    ]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API}`, // Make sure to set this in your .env
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an academic curriculum expert. Return only valid JSON with no additional formatting or text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Parse the JSON response
    const subjects = JSON.parse(content);
    return subjects;
  } catch (error) {
    console.error('Error generating subjects:', error);
    throw error;
  }
};

export default function LevelSelectionScreen() {
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { updateData, data } = useOnboarding();

  const handleNext = async () => {
    if (!selectedLevel) return;

    const selectedLevelData = levels.find(level => level.id === selectedLevel);
    if (!selectedLevelData) return;

    try {
      setIsGenerating(true);

      // Update level data first
      updateData({
        level_of_study: selectedLevelData.name
      });

      // Generate subjects using the selected course and level
      const generatedSubjects = await generateSubjects(
        data.course_of_study || '',
        selectedLevelData.name
      );

      // Store generated subjects in context for use in subject selection
      updateData({
        generated_subjects: generatedSubjects
      });

      router.push("/(onboarding)/subject-selection");
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to generate subjects. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => router.back();

  const LevelCard = ({ level, index }: { level: Level; index: number }) => {
    const isSelected = selectedLevel === level.id;
    const scaleValue = new Animated.Value(1);

    const handlePress = () => {
      if (isGenerating) return; // Prevent selection while generating

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

      setSelectedLevel(level.id);
    };

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          opacity: isGenerating ? 0.6 : 1,
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          disabled={isGenerating}
          className={`p-5 rounded-2xl mb-4 border-2 shadow-sm transition-all duration-200 ${isSelected
            ? 'bg-emerald-50 border-emerald-500 shadow-emerald-500/20'
            : 'bg-white border-gray-200'
            }`}
          style={isSelected ? { elevation: 4 } : { elevation: 2 }}
        >
          <View className="flex-row items-center">
            <View
              className="w-16 h-16 rounded-2xl justify-center items-center mr-4 shadow-sm"
              style={{
                backgroundColor: level.color + '15',
                borderColor: level.color + '30',
                borderWidth: 1
              }}
            >
              <Text className="text-2xl">{level.icon}</Text>
            </View>

            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-2">
                <Text className={`text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                  {level.name}
                </Text>

                {/* Difficulty Badge */}
                <View
                  className="ml-3 px-2 py-1 rounded-full"
                  style={{ backgroundColor: getDifficultyColor(level.difficulty) + '20' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getDifficultyColor(level.difficulty) }}
                  >
                    {level.difficulty}
                  </Text>
                </View>
              </View>

              <Text className={`text-sm mb-1 leading-5 ${isSelected ? 'text-gray-700' : 'text-gray-600'
                }`}>
                {level.description}
              </Text>

              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 ml-1 font-medium">
                  {level.duration}
                </Text>
              </View>
            </View>

            <View className={`w-7 h-7 rounded-full border-2 justify-center items-center transition-all duration-200 ${isSelected
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300'
              }`}>
              {isSelected && !isGenerating && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ProgressHeader
        step={2}
        totalSteps={5}
        handleBack={handleBack}
        handleNext={handleNext}
        nextDisabled={!selectedLevel || isGenerating}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-black text-gray-900 mb-3">
            Choose Your Level
          </Text>
          <Text className="text-lg text-gray-600 leading-relaxed">
            Select the academic level that matches your current progress
          </Text>
        </View>

        {/* Course Context */}
        {data.course_of_study && (
          <View className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="school-outline" size={20} color="#3B82F6" />
              <Text className="text-blue-700 font-semibold ml-2">Selected Course</Text>
            </View>
            <Text className="text-blue-800 font-bold">
              {data.course_of_study}
            </Text>
            <Text className="text-blue-600 text-sm mt-1">
              We'll generate relevant subjects based on your course and level selection
            </Text>
          </View>
        )}

        {/* Loading State */}
        {isGenerating && (
          <View className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text className="text-amber-700 font-semibold ml-3">
                Generating personalized subjects...
              </Text>
            </View>
            <Text className="text-amber-600 text-sm mt-2">
              This may take a few moments. Please don't navigate away.
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <Text className="text-blue-700 font-semibold ml-2">Quick Guide</Text>
          </View>
          <Text className="text-blue-600 text-sm leading-relaxed">
            Choose your current academic year or select "Learning is Fun" for flexible, self-paced learning
          </Text>
        </View>

        {/* Levels List */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Academic Levels ({levels.length})
          </Text>

          {levels.map((level, index) => (
            <LevelCard key={level.id} level={level} index={index} />
          ))}
        </View>

        {/* Selected Level Info */}
        {selectedLevel && !isGenerating && (
          <View className="mt-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text className="text-emerald-700 font-semibold ml-2">Level Selected</Text>
            </View>
            <Text className="text-emerald-800 font-bold text-base">
              {levels.find(l => l.id === selectedLevel)?.name}
            </Text>
            <Text className="text-emerald-600 text-sm mt-1">
              Tap "Next" to generate subjects for {data.course_of_study}
            </Text>
          </View>
        )}

        {/* Recommendation Section */}
        <View className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <View className="flex-row items-start">
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" className="mt-0.5" />
            <View className="flex-1 ml-3">
              <Text className="text-amber-700 font-semibold mb-1">Pro Tip</Text>
              <Text className="text-amber-600 text-sm leading-relaxed">
                Not sure about your level? Start with a lower level to build a strong foundation,
                or choose "Learning is Fun" for a personalized experience.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}