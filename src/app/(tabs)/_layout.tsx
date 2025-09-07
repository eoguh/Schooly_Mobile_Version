import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

export default function TabsLayout() {
  const { isAuthenticated, isLoading, user, accessToken } = useAuth();

  console.log('📱 TabsLayout render - Auth state:', {
    isAuthenticated,
    isLoading,
    user: user ? `${user.username} (${user.email})` : 'null',
    token: accessToken ? 'EXISTS' : 'null'
  });

  // Show loading or redirect to auth if not authenticated
  if (isLoading) {
    console.log('⏳ TabsLayout - Still loading, showing loading state');
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    console.log('🔒 TabsLayout - Not authenticated, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  console.log('✅ TabsLayout - User is authenticated, showing tabs');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981', // emerald-500
        tabBarInactiveTintColor: '#9CA3AF', // gray-400
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB', // gray-200
          paddingTop: 8,
          paddingBottom: 10,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}