import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Animated, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProgressHeader from '@/components/ProgressHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/context/OnboardingContext';

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'Core' | 'Elective' | 'Practical';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

// Fallback subjects (in case API fails or for initial development)
const fallbackSubjects: Subject[] = [
  {
    id: 'english-language',
    name: 'English Language',
    description: 'Grammar, literature, and communication skills',
    icon: '🇬🇧',
    color: '#3B82F6',
    category: 'Core',
    difficulty: 'Beginner'
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Algebra, calculus, and mathematical reasoning',
    icon: '📊',
    color: '#8B5CF6',
    category: 'Core',
    difficulty: 'Intermediate'
  },
  {
    id: 'physics',
    name: 'Physics',
    description: 'Mechanics, thermodynamics, and quantum theory',
    icon: '⚛️',
    color: '#10B981',
    category: 'Core',
    difficulty: 'Advanced'
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    description: 'Organic, inorganic, and analytical chemistry',
    icon: '🧪',
    color: '#F59E0B',
    category: 'Core',
    difficulty: 'Intermediate'
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    description: 'Algorithms, data structures, and computing theory',
    icon: '💻',
    color: '#EF4444',
    category: 'Core',
    difficulty: 'Advanced'
  },
  {
    id: 'general-studies',
    name: 'General Studies',
    description: 'Interdisciplinary knowledge and critical thinking',
    icon: '📚',
    color: '#22C55E',
    category: 'Elective',
    difficulty: 'Beginner'
  },
  {
    id: 'biology',
    name: 'Biology',
    description: 'Cell biology, genetics, and life sciences',
    icon: '🧬',
    color: '#06B6D4',
    category: 'Core',
    difficulty: 'Intermediate'
  },
  {
    id: 'introduction-to-design',
    name: 'Introduction to Design',
    description: 'Design principles, aesthetics, and creativity',
    icon: '🎨',
    color: '#F97316',
    category: 'Practical',
    difficulty: 'Beginner'
  }
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Core': return '#059669';
    case 'Elective': return '#3B82F6';
    case 'Practical': return '#F59E0B';
    default: return '#6B7280';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return '#10B981';
    case 'Intermediate': return '#F59E0B';
    case 'Advanced': return '#EF4444';
    default: return '#6B7280';
  }
};

export default function SubjectSelectionScreen() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { updateData, data } = useOnboarding();

  // Load subjects on component mount
  useEffect(() => {
    // Use generated subjects if available, otherwise use fallback
    if (data.generated_subjects && Array.isArray(data.generated_subjects)) {
      setSubjects(data.generated_subjects);
    } else {
      setSubjects(fallbackSubjects);
      // Show a message if we're using fallback subjects
      if (data.course_of_study) {
        Alert.alert(
          'Using Default Subjects',
          'We\'re using a default subject list. Generated subjects may not be available.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [data.generated_subjects]);

  const handleNext = () => {
    if (selectedSubjects.length === 0) {
      Alert.alert(
        'No Subjects Selected',
        'Please select at least one subject to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Get the names of selected subjects and join with commas
    const selectedSubjectNames = selectedSubjects
      .map(subjectId => subjects.find(subject => subject.id === subjectId)?.name)
      .filter(name => name) // Remove any undefined values
      .join(', ');

    updateData({
      subjects: selectedSubjectNames
    });
    router.push("/(onboarding)/daily-goals");
  };

  const handleBack = () => router.back();

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        // Remove if already selected
        return prev.filter(id => id !== subjectId);
      } else {
        // Add if not selected
        return [...prev, subjectId];
      }
    });
  };

  const selectAll = () => {
    if (selectedSubjects.length === filteredSubjects.length) {
      // If all are selected, deselect all
      setSelectedSubjects([]);
    } else {
      // Select all filtered subjects
      setSelectedSubjects(filteredSubjects.map(subject => subject.id));
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || subject.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Get unique categories from subjects
  const categories = ['All', ...new Set(subjects.map(s => s.category))];

  const SubjectCard = ({ subject, index }: { subject: Subject; index: number }) => {
    const isSelected = selectedSubjects.includes(subject.id);
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

      toggleSubject(subject.id);
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
                backgroundColor: subject.color + '15',
                borderColor: subject.color + '30',
                borderWidth: 1
              }}
            >
              <Text className="text-2xl">{subject.icon}</Text>
            </View>

            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-2">
                <Text className={`text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                  {subject.name}
                </Text>
              </View>

              <Text className={`text-sm mb-2 leading-5 ${isSelected ? 'text-gray-700' : 'text-gray-600'
                }`}>
                {subject.description}
              </Text>

              {/* Category and Difficulty Badges */}
              <View className="flex-row items-center space-x-2">
                <View
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: getCategoryColor(subject.category) + '20' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getCategoryColor(subject.category) }}
                  >
                    {subject.category}
                  </Text>
                </View>

                <View
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: getDifficultyColor(subject.difficulty) + '20' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getDifficultyColor(subject.difficulty) }}
                  >
                    {subject.difficulty}
                  </Text>
                </View>
              </View>
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
        step={3}
        totalSteps={5}
        handleBack={handleBack}
        handleNext={handleNext}
        nextDisabled={selectedSubjects.length === 0}
      />

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header Section */}
        <View className="mb-6">
          <Text className="text-3xl font-black text-gray-900 mb-3">
            Choose Your Subjects
          </Text>
          <Text className="text-lg text-gray-600 leading-relaxed">
            Select the subjects you'd like to focus on for your learning journey
          </Text>
        </View>

        {/* Course & Level Context */}
        {(data.course_of_study || data.level_of_study) && (
          <View className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="school-outline" size={20} color="#3B82F6" />
              <Text className="text-blue-700 font-semibold ml-2">Your Selection</Text>
            </View>
            {data.course_of_study && (
              <Text className="text-blue-800 font-bold">
                Course: {data.course_of_study}
              </Text>
            )}
            {data.level_of_study && (
              <Text className="text-blue-800 font-bold">
                Level: {data.level_of_study}
              </Text>
            )}
            <Text className="text-blue-600 text-sm mt-1">
              {data.generated_subjects ? 'AI-generated subjects based on your selection' : 'Default subject selection'}
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View className="mb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-gray-900"
              placeholder="Search subjects..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Categories */}
        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <View className="flex-row gap-x-2">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedFilter(category)}
                  className={`px-4 py-2 rounded-full border ${selectedFilter === category
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-gray-200'
                    }`}
                >
                  <Text className={`font-semibold ${selectedFilter === category
                    ? 'text-white'
                    : 'text-gray-700'
                    }`}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Results Summary & Actions */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">
            Available Subjects ({filteredSubjects.length})
          </Text>
          <View className="flex-row items-center space-x-3">
            {selectedSubjects.length > 0 && (
              <View className="px-3 py-1 bg-emerald-100 rounded-full">
                <Text className="text-emerald-700 font-semibold text-sm">
                  {selectedSubjects.length} selected
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={selectAll}
              className="px-3 py-1 bg-gray-100 rounded-full"
            >
              <Text className="text-gray-700 font-semibold text-sm">
                {selectedSubjects.length === filteredSubjects.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subjects List */}
        <View className="mb-4">
          {filteredSubjects.map((subject, index) => (
            <SubjectCard key={subject.id} subject={subject} index={index} />
          ))}

          {filteredSubjects.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">
                No subjects found
              </Text>
              <Text className="text-gray-400 text-center">
                Try adjusting your search or filter criteria
              </Text>
            </View>
          )}
        </View>

        {/* Selection Summary */}
        {selectedSubjects.length > 0 && (
          <View className="mt-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text className="text-emerald-700 font-semibold ml-2">
                Selected Subjects ({selectedSubjects.length})
              </Text>
            </View>

            {/* Display selected subjects in a nice format */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {selectedSubjects.slice(0, 6).map((subjectId) => {
                const subject = subjects.find(s => s.id === subjectId);
                if (!subject) return null;

                return (
                  <View
                    key={subjectId}
                    className="flex-row items-center px-3 py-2 bg-white rounded-lg border border-emerald-200"
                  >
                    <Text className="text-lg mr-2">{subject.icon}</Text>
                    <Text className="text-emerald-800 font-medium text-sm">
                      {subject.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleSubject(subjectId)}
                      className="ml-2"
                    >
                      <Ionicons name="close-circle" size={16} color="#059669" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {selectedSubjects.length > 6 && (
                <View className="px-3 py-2 bg-emerald-100 rounded-lg border border-emerald-200">
                  <Text className="text-emerald-700 font-medium text-sm">
                    +{selectedSubjects.length - 6} more
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-emerald-600 text-sm">
              Ready to set your daily learning goals for these subjects
            </Text>
          </View>
        )}

        {/* Help Section */}
        <View className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" className="mt-0.5" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-700 font-semibold mb-1">Selection Tips</Text>
              <Text className="text-blue-600 text-sm leading-relaxed">
                • You can select multiple subjects to create a comprehensive study plan
                {'\n'}• Start with 2-4 subjects to avoid overwhelming yourself
                {'\n'}• Mix different difficulty levels for balanced learning
                {'\n'}• Core subjects are fundamental to most academic programs
                {'\n'}• You can modify your selection anytime in settings
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {filteredSubjects.length > 0 && (
          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                const coreSubjects = filteredSubjects.filter(s => s.category === 'Core').slice(0, 3);
                setSelectedSubjects(coreSubjects.map(s => s.id));
              }}
              className="flex-1 p-3 bg-white rounded-xl border border-gray-200 items-center"
            >
              <Text className="text-gray-700 font-semibold text-sm">Quick: Core Only</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const beginnerSubjects = filteredSubjects.filter(s => s.difficulty === 'Beginner').slice(0, 4);
                setSelectedSubjects(beginnerSubjects.map(s => s.id));
              }}
              className="flex-1 p-3 bg-white rounded-xl border border-gray-200 items-center"
            >
              <Text className="text-gray-700 font-semibold text-sm">Quick: Beginner</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}