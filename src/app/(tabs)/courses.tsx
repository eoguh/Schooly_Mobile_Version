import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator, RefreshControl, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Topic, SubTopic } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import WebView from 'react-native-webview';

const { width } = Dimensions.get('window');

interface CourseProgress {
  [topicId: number]: {
    completed: number;
    total: number;
  };
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

export default function CoursesScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoPlayerData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courseProgress, setCourseProgress] = useState<CourseProgress>({});

  useEffect(() => {
    loadTopics();
    // Initialize progress - in a real app, this would come from user data
    initializeProgress();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTopics();
      if (response.success && response.data) {
        setTopics(response.data);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopics();
    setRefreshing(false);
  };

  const initializeProgress = () => {
    // Mock progress data - in real app, fetch from API
    const mockProgress: CourseProgress = {
      5: { completed: 1, total: 2 },
      6: { completed: 0, total: 2 },
      7: { completed: 2, total: 2 },
      8: { completed: 1, total: 2 },
      9: { completed: 0, total: 2 },
      10: { completed: 1, total: 2 },
      11: { completed: 0, total: 2 },
      12: { completed: 0, total: 2 },
    };
    setCourseProgress(mockProgress);
  };

  const getCategories = () => {
    const categories = ['All'];
    topics.forEach(topic => {
      // Extract category from topic name or create generic categories
      const category = getCategoryFromTopicName(topic.name);
      if (!categories.includes(category)) {
        categories.push(category);
      }
    });
    return categories;
  };

  const getCategoryFromTopicName = (name: string) => {
    if (name.toLowerCase().includes('engineering')) return 'Engineering';
    if (name.toLowerCase().includes('mathematics') || name.toLowerCase().includes('math')) return 'Mathematics';
    if (name.toLowerCase().includes('fluid') || name.toLowerCase().includes('heat') || name.toLowerCase().includes('mass')) return 'Physics';
    if (name.toLowerCase().includes('chemical')) return 'Chemistry';
    if (name.toLowerCase().includes('instrumentation') || name.toLowerCase().includes('control')) return 'Control Systems';
    return 'General';
  };

  const filteredTopics = selectedCategory === 'All'
    ? topics
    : topics.filter(topic => getCategoryFromTopicName(topic.name) === selectedCategory);

  const getTopicColor = (topicId: number) => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#EF4444',
      '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'
    ];
    return colors[topicId % colors.length];
  };

  const getDifficultyLevel = (topic: Topic) => {
    // Determine difficulty based on topic name
    if (topic.name.toLowerCase().includes('fundamentals') ||
      topic.name.toLowerCase().includes('introduction') ||
      topic.name.toLowerCase().includes('basics')) {
      return { level: 'Beginner', color: '#10B981' };
    }
    if (topic.name.toLowerCase().includes('advanced')) {
      return { level: 'Advanced', color: '#EF4444' };
    }
    return { level: 'Intermediate', color: '#F59E0B' };
  };

  const getProgressPercentage = (topicId: number) => {
    const progress = courseProgress[topicId];
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  const getTotalDuration = (subTopics: SubTopic[]) => {
    let totalMinutes = 0;
    subTopics.forEach(subTopic => {
      const start = new Date(`2000-01-01 ${subTopic.class_time_start}`);
      const end = new Date(`2000-01-01 ${subTopic.class_time_end}`);
      totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const getRating = () => {
    // Mock rating - in real app, this would come from user reviews
    return (4.5 + Math.random() * 0.4).toFixed(1);
  };

  const openYouTubeLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

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

  const embedHtml = videoId ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          html, body { margin: 0; padding: 0; background-color: #000; height: 100%; }
          .video-container { position: relative; width: 100%; height: 100%; }
          iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <div class="video-container">
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1&origin=https://www.youtube.com"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </body>
    </html>
  ` : '';

  return (
    <Modal
      visible={videoPlayerVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeVideoPlayer}
    >
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Header */}
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

        {/* Video Player */}
        <View className="flex-1 bg-black">
          {videoLoading && (
            <View className="absolute inset-0 bg-black items-center justify-center z-10">
              <ActivityIndicator size="large" color="#FF0000" />
              <Text className="text-white mt-4">Loading video...</Text>
            </View>
          )}

          {videoId ? (
            <WebView
              source={{ html: embedHtml }}
              style={{ flex: 1, backgroundColor: 'black' }}
              onLoadEnd={() => setVideoLoading(false)}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              mixedContentMode="compatibility"
              originWhitelist={['*']}
              bounces={false}
              scrollEnabled={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-white text-center">
                Couldn't parse this video link. Try opening it directly on YouTube.
              </Text>
              <TouchableOpacity
                onPress={() => openYouTubeLink(currentVideo.videoUrl)}
                className="mt-4 bg-red-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Open in YouTube</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-600 mt-4">Loading your courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View className="px-6 pt-6 pb-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Courses</Text>
          <Text className="text-gray-600 text-sm mt-1">
            Browse and continue your learning journey
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 py-4 bg-white border-b border-gray-100">
          <View className="flex-row justify-between">
            <View className="bg-emerald-50 rounded-2xl p-4 flex-1 mr-2 border border-emerald-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="school-outline" size={20} color="#10B981" />
                <Text className="text-2xl font-bold text-emerald-700">
                  {topics.length}
                </Text>
              </View>
              <Text className="text-emerald-600 text-sm font-medium">Total Courses</Text>
            </View>

            <View className="bg-blue-50 rounded-2xl p-4 flex-1 mx-1 border border-blue-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="play-circle-outline" size={20} color="#3B82F6" />
                <Text className="text-2xl font-bold text-blue-700">
                  {Object.values(courseProgress).filter(p => p.completed > 0).length}
                </Text>
              </View>
              <Text className="text-blue-600 text-sm font-medium">In Progress</Text>
            </View>

            <View className="bg-yellow-50 rounded-2xl p-4 flex-1 ml-2 border border-yellow-100">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                <Text className="text-2xl font-bold text-yellow-700">
                  {Object.values(courseProgress).filter(p => p.completed === p.total).length}
                </Text>
              </View>
              <Text className="text-yellow-600 text-sm font-medium">Completed</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View className="px-6 py-4 bg-white border-b border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-x-3">
              {getCategories().map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-2xl border ${selectedCategory === category
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

        {/* Course Grid */}
        <View className="px-6 py-4">
          {filteredTopics.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {filteredTopics.map((topic) => {
                const color = getTopicColor(topic.id);
                const difficulty = getDifficultyLevel(topic);
                const progress = getProgressPercentage(topic.id);
                const rating = getRating();

                return (
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
                        <Text className="text-gray-500 text-sm mb-3">
                          {topic.sub_topics.length} lessons
                        </Text>
                      </View>
                      <TouchableOpacity>
                        <Ionicons name="heart-outline" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    {/* Progress */}
                    {progress > 0 && (
                      <View className="mb-3">
                        <View className="bg-gray-100 rounded-full h-2">
                          <View
                            className="rounded-full h-2"
                            style={{ width: `${progress}%`, backgroundColor: color }}
                          />
                        </View>
                        <Text className="text-xs text-gray-500 mt-1">
                          {progress}% complete
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#10B981" />
                        <Text className="text-emerald-600 text-xs ml-1 font-medium">
                          {getTotalDuration(topic.sub_topics)}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="star" size={14} color="#FCD34D" />
                        <Text className="text-yellow-500 text-xs ml-1 font-medium">
                          {rating}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-3">
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: difficulty.color + '20' }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: difficulty.color }}
                        >
                          {difficulty.level}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="videocam-outline" size={12} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">
                          {topic.sub_topics.length} videos
                        </Text>
                      </View>
                    </View>

                    {/* Quick Access to First Video */}
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
                );
              })}
            </View>
          ) : (
            <View className="items-center py-20">
              <Ionicons name="school-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">
                No courses found
              </Text>
              <Text className="text-gray-400 text-center">
                Try adjusting your filter criteria or check back later
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <VideoPlayer />
    </SafeAreaView>
  );
}
