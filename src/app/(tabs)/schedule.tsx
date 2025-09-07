import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Topic, SubTopic } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

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

export default function ScheduleScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('All');
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoPlayerData | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const daysOfWeek = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    loadTopics();
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

  const getScheduleItems = (): ScheduleItem[] => {
    const items: ScheduleItem[] = [];

    topics.forEach(topic => {
      topic.sub_topics.forEach(subTopic => {
        const days = subTopic.class_days.split(',').map(day => day.trim());
        days.forEach(day => {
          items.push({
            id: subTopic.id,
            subTopic,
            topicName: topic.name,
            topicId: topic.id,
            dayOfWeek: day,
            isToday: day === today
          });
        });
      });
    });

    return items.sort((a, b) => {
      const timeA = a.subTopic.class_time_start;
      const timeB = b.subTopic.class_time_start;
      return timeA.localeCompare(timeB);
    });
  };

  const filteredSchedule = getScheduleItems().filter(item =>
    selectedDay === 'All' || item.dayOfWeek === selectedDay
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeRange = (start: string, end: string) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const getTopicColor = (topicId: number) => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#EF4444',
      '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'
    ];
    return colors[topicId % colors.length];
  };

  const getTodaySchedule = () => {
    return getScheduleItems().filter(item => item.isToday);
  };

  const getUpcomingClass = () => {
    const todaySchedule = getTodaySchedule();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    return todaySchedule.find(item => item.subTopic.class_time_start > currentTime);
  };

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
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-600 mt-4">Loading your schedule...</Text>
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
          <Text className="text-xl font-bold text-gray-900">Schedule</Text>
          <Text className="text-gray-600 text-sm mt-1">
            Your personalized learning timetable
          </Text>
        </View>

        {/* Today's Highlight */}
        {getUpcomingClass() && (
          <View className="px-6 py-4 bg-white border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-3">Next Class</Text>
            {(() => {
              const upcoming = getUpcomingClass()!;
              const color = getTopicColor(upcoming.topicId);
              return (
                <LinearGradient
                  colors={[color, color + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl p-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg mb-1">
                        {upcoming.subTopic.sub_topic}
                      </Text>
                      <Text className="text-white/90 text-sm mb-2">
                        {upcoming.topicName}
                      </Text>
                      <Text className="text-white/80 text-sm">
                        {getTimeRange(upcoming.subTopic.class_time_start, upcoming.subTopic.class_time_end)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="bg-white/20 p-3 rounded-xl"
                      onPress={() => playVideo(
                        upcoming.subTopic.youtube_link,
                        upcoming.subTopic.sub_topic,
                        upcoming.topicName
                      )}
                    >
                      <Ionicons name="play" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              );
            })()}
          </View>
        )}

        {/* Stats */}
        <View className="px-6 py-4 bg-white border-b border-gray-100">
          <View className="flex-row justify-between">
            <View className="bg-gray-50 rounded-2xl p-4 flex-1 mr-2">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="book-outline" size={20} color="#3B82F6" />
                <Text className="text-2xl font-bold text-gray-900">
                  {topics.length}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-medium">Total Subjects</Text>
            </View>

            <View className="bg-gray-50 rounded-2xl p-4 flex-1 mx-1">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="calendar-outline" size={20} color="#10B981" />
                <Text className="text-2xl font-bold text-gray-900">
                  {getTodaySchedule().length}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-medium">Classes Today</Text>
            </View>

            <View className="bg-gray-50 rounded-2xl p-4 flex-1 ml-2">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="videocam-outline" size={20} color="#EF4444" />
                <Text className="text-2xl font-bold text-gray-900">
                  {getScheduleItems().length}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-medium">Total Classes</Text>
            </View>
          </View>
        </View>

        {/* Day Filter */}
        <View className="px-6 py-4 bg-white border-b border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-x-3">
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-2xl border ${selectedDay === day
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-gray-200'
                    }`}
                >
                  <Text
                    className={`font-semibold ${selectedDay === day ? 'text-white' : 'text-gray-700'
                      }`}
                  >
                    {day === today && day !== 'All' ? `${day} (Today)` : day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Schedule List */}
        <View className="px-6 py-4">
          {filteredSchedule.length > 0 ? (
            <View className="space-y-4">
              {filteredSchedule.map((item, index) => (
                <View
                  key={`${item.id}-${item.dayOfWeek}-${index}`}
                  className={`bg-white rounded-2xl p-4 border shadow-sm ${item.isToday ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100'
                    }`}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: getTopicColor(item.topicId) }}
                        />
                        <Text className="text-gray-900 font-bold text-base flex-1">
                          {item.subTopic.sub_topic}
                        </Text>
                        {item.isToday && (
                          <View className="bg-emerald-500 px-2 py-1 rounded-full">
                            <Text className="text-white text-xs font-semibold">Today</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-600 text-sm mb-2 font-medium">
                        {item.topicName}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#10B981" />
                        <Text className="text-emerald-600 text-sm ml-1 font-medium">
                          {getTimeRange(item.subTopic.class_time_start, item.subTopic.class_time_end)}
                        </Text>
                        <Text className="text-gray-400 text-sm ml-3">
                          {item.dayOfWeek}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => playVideo(
                      item.subTopic.youtube_link,
                      item.subTopic.sub_topic,
                      item.topicName
                    )}
                    className="flex-row items-center justify-center bg-red-500 rounded-xl py-3"
                  >
                    <Ionicons name="play" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Watch in App</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center py-20">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">
                No classes scheduled
              </Text>
              <Text className="text-gray-400 text-center">
                {selectedDay === 'All'
                  ? 'No classes found in your schedule'
                  : `No classes scheduled for ${selectedDay}`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <VideoPlayer />
    </SafeAreaView>
  );
}