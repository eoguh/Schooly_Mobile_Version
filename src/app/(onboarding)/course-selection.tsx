import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressHeader from '@/components/ProgressHeader';
import { useOnboarding } from '@/context/OnboardingContext';
import { Course, courses } from '@/services/courses';

export default function CourseSelectionScreen() {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { updateData } = useOnboarding();

  const handleNext = () => {
    if (!selectedCourse) {
      return;
    }

    const selectedCourseData = courses.find(course => course.id === selectedCourse);
    if (selectedCourseData) {
      updateData({
        course_of_study: selectedCourseData.name,
      });
      router.push("/(onboarding)/level-selection");
    }
  };

  const handleBack = () => router.back();

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CourseCard = ({ course, index }: { course: Course; index: number }) => {
    const isSelected = selectedCourse === course.id;
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

      setSelectedCourse(course.id);
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
                backgroundColor: course.color + '15',
                borderColor: course.color + '30',
                borderWidth: 1
              }}
            >
              <Text className="text-2xl">{course.icon}</Text>
            </View>

            <View className="flex-1 mr-3">
              <Text className={`text-lg font-bold mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-800'
                }`}>
                {course.name}
              </Text>
              <Text className={`text-sm leading-5 ${isSelected ? 'text-gray-700' : 'text-gray-600'
                }`}>
                {course.description}
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
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ProgressHeader
        step={1}
        totalSteps={5}
        handleBack={handleBack}
        handleNext={handleNext}
        nextDisabled={!selectedCourse}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-black text-gray-900 mb-3">
            Choose Your Course
          </Text>
          <Text className="text-lg text-gray-600 leading-relaxed">
            Select the field of study you're passionate about
          </Text>
        </View>

        {/* Search Section - Future Enhancement */}
        <View className="mb-6">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <Text className="flex-1 ml-3 text-gray-500">
              Search courses... (Coming soon)
            </Text>
          </View>
        </View>

        {/* Courses Grid */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Available Courses ({courses.length})
          </Text>

          {filteredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </View>

        {/* Selected Course Info */}
        {selectedCourse && (
          <View className="mt-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text className="text-emerald-700 font-semibold ml-2">Course Selected</Text>
            </View>
            <Text className="text-emerald-800 font-bold text-base">
              {courses.find(c => c.id === selectedCourse)?.name}
            </Text>
            <Text className="text-emerald-600 text-sm mt-1">
              Tap "Next" to choose your level
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}