import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, RefreshControl, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService, Topic, SubTopic } from '@/services/api';
import { WebView } from 'react-native-webview';
import { Orientation } from 'expo-screen-orientation';

const { width } = Dimensions.get('window');

interface UserAcademicInfo {
  id: number;
  course_of_study: string;
  level_of_study: string;
  subjects: string;
  daily_attention_target: number;
}

interface ScheduleItem {
  id: number;
  subTopic: SubTopic;
  topicName: string;
  topicId: number;
  dayOfWeek: string;
  isToday: boolean;
}

interface VideoPlayerData {
  videoUrl: string;
  title: string;
  topicName: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [academicInfo, setAcademicInfo] = useState<UserAcademicInfo | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoPlayerData | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    loadData();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [academicResponse, topicsResponse] = await Promise.all([
        apiService.getAcademicInfo(),
        apiService.getTopics()
      ]);

      if (academicResponse.success && academicResponse.data) {
        setAcademicInfo(academicResponse.data);
      }

      if (topicsResponse.success && topicsResponse.data) {
        setTopics(topicsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getSubjectIcon = (subject: string) => {
    const subjectLower = subject?.toLowerCase() || '';
    if (subjectLower.includes('math')) return '📊';
    if (subjectLower.includes('english')) return '🇬🇧';
    if (subjectLower.includes('physics')) return '⚛️';
    if (subjectLower.includes('chemistry') || subjectLower.includes('chemical')) return '🧪';
    if (subjectLower.includes('biology')) return '🧬';
    if (subjectLower.includes('computer') || subjectLower.includes('programming')) return '💻';
    if (subjectLower.includes('design')) return '🎨';
    if (subjectLower.includes('engineering')) return '⚙️';
    if (subjectLower.includes('fluid') || subjectLower.includes('mechanics')) return '🌊';
    if (subjectLower.includes('heat') || subjectLower.includes('thermal')) return '🔥';
    return '📖';
  };

  const getTopicColor = (topicId: number) => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#EF4444',
      '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'
    ];
    return colors[topicId % colors.length];
  };

  const getTodaySchedule = (): ScheduleItem[] => {
    const items: ScheduleItem[] = [];

    topics.forEach(topic => {
      topic.sub_topics.forEach(subTopic => {
        const days = subTopic.class_days.split(',').map(day => day.trim());
        if (days.includes(today)) {
          items.push({
            id: subTopic.id,
            subTopic,
            topicName: topic.name,
            topicId: topic.id,
            dayOfWeek: today,
            isToday: true
          });
        }
      });
    });

    return items.sort((a, b) =>
      a.subTopic.class_time_start.localeCompare(b.subTopic.class_time_start)
    );
  };

  const getUpcomingClass = () => {
    const todaySchedule = getTodaySchedule();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    return todaySchedule.find(item => item.subTopic.class_time_start > currentTime);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getCategories = () => {
    const categories = ['All'];
    topics.forEach(topic => {
      const category = getCategoryFromTopicName(topic.name);
      if (!categories.includes(category)) {
        categories.push(category);
      }
    });
    return categories.slice(0, 6); // Limit to 6 categories
  };

  const getCategoryFromTopicName = (name: string) => {
    if (name.toLowerCase().includes('engineering')) return 'Engineering';
    if (name.toLowerCase().includes('mathematics') || name.toLowerCase().includes('math')) return 'Mathematics';
    if (name.toLowerCase().includes('fluid') || name.toLowerCase().includes('heat') || name.toLowerCase().includes('mass')) return 'Physics';
    if (name.toLowerCase().includes('chemical')) return 'Chemistry';
    if (name.toLowerCase().includes('instrumentation') || name.toLowerCase().includes('control')) return 'Control Systems';
    return 'General';
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.sub_topics.some(sub => sub.sub_topic.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || getCategoryFromTopicName(topic.name) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const playVideo = (videoUrl: string, title: string, topicName: string) => {
    setCurrentVideo({ videoUrl, title, topicName });
    setVideoPlayerVisible(true);
    setVideoLoading(true);
  };

  const closeVideoPlayer = () => {
    setVideoPlayerVisible(false);
    setCurrentVideo(null);
    setVideoLoading(false);
  };

  const VideoPlayer = () => {
    if (!currentVideo) return null;

    const videoId = getVideoId(currentVideo.videoUrl);
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&controls=1&modestbranding=1`
      : currentVideo.videoUrl;

    return (
      <Modal
        visible={videoPlayerVisible}
        animationType="slide"
        presentationStyle={isLandscape ? "fullScreen" : "formSheet"}
        onRequestClose={closeVideoPlayer}
      >
        <SafeAreaView className="flex-1 bg-black">
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

          {/* Header - Hide in landscape for fullscreen experience */}
          {!isLandscape && (
            <View className="px-4 py-3 bg-black/90 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={closeVideoPlayer}
                className="p-2 rounded-full bg-white/20"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              <View className="flex-1 mx-4">
                <Text className="text-white font-bold text-base" numberOfLines={1}>
                  {currentVideo.title}
                </Text>
                <Text className="text-white/70 text-sm" numberOfLines={1}>
                  {currentVideo.topicName}
                </Text>
              </View>

              <TouchableOpacity className="p-2 rounded-full bg-white/20">
                <Ionicons name="bookmark-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Video Player */}
          <View className="flex-1 bg-black">
            {videoLoading && (
              <View className="absolute inset-0 bg-black items-center justify-center z-10">
                <ActivityIndicator size="large" color="#FF0000" />
                <Text className="text-white mt-4">Loading video...</Text>
              </View>
            )}

            <WebView
              source={{ uri: embedUrl }}
              style={{ flex: 1, backgroundColor: 'black' }}
              onLoadEnd={() => setVideoLoading(false)}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              scalesPageToFit={true}
              bounces={false}
              scrollEnabled={false}
            />
          </View>

          {/* Landscape overlay controls */}
          {isLandscape && (
            <TouchableOpacity
              onPress={closeVideoPlayer}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  const getActiveTopicsCount = () => {
    return topics.filter(topic =>
      topic.sub_topics.some(sub => {
        const days = sub.class_days.split(',').map(d => d.trim());
        return days.includes(today);
      })
    ).length;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-600 mt-4">Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const upcomingClass = getUpcomingClass();
  const todaySchedule = getTodaySchedule();
  const primaryTopic = topics.find(topic =>
    topic.name.toLowerCase().includes(academicInfo?.subjects?.toLowerCase() || '')
  ) || topics[0];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4 bg-white">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <LinearGradient
                colors={['#10B981', '#059669']}
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
              >
                <Text className="text-white font-bold text-lg">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              <View>
                <Text className="text-gray-600 text-sm">
                  {getGreeting()}
                </Text>
                <Text className="text-xl font-bold capitalize text-gray-900">
                  {user?.username || 'Student'}
                </Text>
              </View>
            </View>

            <TouchableOpacity className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center relative">
              <Ionicons name="notifications-outline" size={24} color="#374151" />
              {todaySchedule.length > 0 && (
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">{todaySchedule.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Academic Info Summary */}
          {academicInfo && (
            <View className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 mb-6 border border-emerald-100">
              <View className="flex-row items-center mb-3">
                <Text className="text-3xl mr-3">{getSubjectIcon(academicInfo.subjects)}</Text>
                <View className="flex-1">
                  <Text className="text-emerald-800 font-bold text-lg">
                    {academicInfo.subjects}
                  </Text>
                  <Text className="text-emerald-600 text-sm">
                    {academicInfo.course_of_study} • {academicInfo.level_of_study}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#059669" />
                  <Text className="text-emerald-700 text-sm ml-1 font-medium">
                    {academicInfo.daily_attention_target} min/day goal
                  </Text>
                </View>
                <View className="bg-emerald-200 px-3 py-1 rounded-full">
                  <Text className="text-emerald-800 text-xs font-semibold">
                    Keep it up! 🎯
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Next Class */}
        {upcomingClass && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Next Class</Text>
            <LinearGradient
              colors={[getTopicColor(upcomingClass.topicId), getTopicColor(upcomingClass.topicId) + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl p-6"
            >
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-white/80 text-sm font-medium mb-1">
                    {formatTime(upcomingClass.subTopic.class_time_start)}
                  </Text>
                  <Text className="text-white font-bold text-xl mb-2">
                    {upcomingClass.subTopic.sub_topic}
                  </Text>
                  <Text className="text-white/90 text-sm">
                    {upcomingClass.topicName}
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center"
                  onPress={() => playVideo(
                    upcomingClass.subTopic.youtube_link,
                    upcomingClass.subTopic.sub_topic,
                    upcomingClass.topicName
                  )}
                >
                  <Ionicons name="play" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-white/80 text-sm">
                  Ready to learn?
                </Text>
                <TouchableOpacity
                  className="bg-white px-6 py-3 rounded-2xl"
                  onPress={() => playVideo(
                    upcomingClass.subTopic.youtube_link,
                    upcomingClass.subTopic.sub_topic,
                    upcomingClass.topicName
                  )}
                >
                  <Text className="font-bold" style={{ color: getTopicColor(upcomingClass.topicId) }}>
                    Start Now
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Search and Categories */}
        <View className="px-6 mb-6">
          {/* Search Bar */}
          <View className="flex-row items-center bg-white rounded-2xl px-5 py-4 mb-4 border border-gray-100 shadow-sm">
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search courses, topics, or skills..."
              className="flex-1 ml-3 text-gray-900"
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

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-x-3">
              {getCategories().map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`px-5 py-3 rounded-2xl border ${selectedCategory === category
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-gray-200'
                    }`}
                >
                  <Text
                    className={`font-semibold ${selectedCategory === category ? 'text-white' : 'text-gray-700'
                      }`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Quick Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between">
            <View className="bg-white rounded-2xl p-4 flex-1 mr-2 border border-gray-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="school-outline" size={20} color="#3B82F6" />
                <Text className="text-2xl font-bold text-gray-900">
                  {topics.length}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-medium">Total Subjects</Text>
            </View>

            <View className="bg-white rounded-2xl p-4 flex-1 mx-1 border border-gray-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="calendar-outline" size={20} color="#10B981" />
                <Text className="text-2xl font-bold text-gray-900">
                  {todaySchedule.length}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-medium">Classes Today</Text>
            </View>

            <View className="bg-white rounded-2xl p-4 flex-1 ml-2 border border-gray-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <Text className="text-2xl font-bold text-gray-900">
                  {academicInfo?.daily_attention_target || 30}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-medium">Min Goal</Text>
            </View>
          </View>
        </View>

        {/* Today's Schedule Preview */}
        {todaySchedule.length > 0 && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Today's Classes</Text>
              <TouchableOpacity>
                <Text className="text-emerald-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-x-4">
                {todaySchedule.slice(0, 3).map((item) => (
                  <TouchableOpacity
                    key={`${item.id}-today`}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                    style={{ width: width * 0.7 }}
                    onPress={() => playVideo(
                      item.subTopic.youtube_link,
                      item.subTopic.sub_topic,
                      item.topicName
                    )}
                  >
                    <View className="flex-row items-center mb-2">
                      <View
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: getTopicColor(item.topicId) }}
                      />
                      <Text className="text-gray-900 font-bold text-base flex-1">
                        {item.subTopic.sub_topic}
                      </Text>
                    </View>
                    <Text className="text-gray-600 text-sm mb-2">
                      {item.topicName}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#10B981" />
                        <Text className="text-emerald-600 text-sm ml-1 font-medium">
                          {formatTime(item.subTopic.class_time_start)}
                        </Text>
                      </View>
                      <View className="bg-red-500 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">Watch</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Course Grid */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">
              {selectedCategory === 'All' ? 'All Subjects' : selectedCategory}
              ({filteredTopics.length})
            </Text>
            <TouchableOpacity>
              <Text className="text-emerald-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {filteredTopics.slice(0, 4).map((topic) => (
              <TouchableOpacity
                key={topic.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm"
                style={{ width: (width - 48) / 2 - 6 }}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-base mb-2 leading-tight">
                      {topic.name}
                    </Text>
                    <Text className="text-gray-500 text-sm mb-2">
                      {topic.sub_topics.length} lessons
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="heart-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="videocam-outline" size={14} color="#EF4444" />
                    <Text className="text-red-500 text-xs ml-1 font-medium">
                      {topic.sub_topics.length} videos
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={14} color="#10B981" />
                    <Text className="text-emerald-600 text-xs ml-1 font-medium">
                      {topic.sub_topics.some(sub => sub.class_days.split(',').map(d => d.trim()).includes(today)) ? 'Today' : 'Scheduled'}
                    </Text>
                  </View>
                </View>

                {topic.sub_topics.length > 0 && (
                  <TouchableOpacity
                    onPress={() => playVideo(
                      topic.sub_topics[0].youtube_link,
                      topic.sub_topics[0].sub_topic,
                      topic.name
                    )}
                    className="flex-row items-center justify-center bg-red-500 rounded-xl py-3"
                  >
                    <Ionicons name="play" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Watch in App</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {filteredTopics.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">
                No courses found
              </Text>
              <Text className="text-gray-400 text-center">
                Try adjusting your search or filter criteria
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <VideoPlayer />
    </SafeAreaView>
  );
}