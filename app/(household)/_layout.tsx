// Household tab layout
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, TAB_BAR_HEIGHT, FontSize, FontWeight } from '../../src/constants';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: any }) {
  return (
    <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
  );
}

export default function HouseholdLayout() {
  const unread = useAppStore(s => s.unreadNotifications);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: FontWeight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color }) => <TabIcon name="calendar" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recycle"
        options={{
          title: 'Recycle',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.recycleTab}>
              <Ionicons name="refresh-circle" size={32} color={focused ? Colors.primary : Colors.gray500} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused, color }) => <TabIcon name="school" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, color }) => <TabIcon name="people" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <View>
              <TabIcon name="person" focused={focused} color={color} />
              {unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      {/* Hidden screens not in tab bar */}
      <Tabs.Screen name="complaints" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  recycleTab: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4, right: -6,
    backgroundColor: Colors.error,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
