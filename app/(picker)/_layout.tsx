// Informal Picker Tab Layout
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, TAB_BAR_HEIGHT, FontSize, FontWeight } from '../../src/constants';
import { useAppStore } from '../../src/stores/appStore';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: any }) {
  return (
    <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
  );
}

export default function PickerLayout() {
  const unread = useAppStore(s => s.unreadNotifications);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.pickerAccent,
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
        name="opportunities"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ focused, color }) => <TabIcon name="storefront" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ focused, color }) => <TabIcon name="briefcase" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="buyers"
        options={{
          title: 'Buyers',
          tabBarIcon: ({ focused, color }) => <TabIcon name="business" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused, color }) => <TabIcon name="cash" focused={focused} color={color} />,
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
