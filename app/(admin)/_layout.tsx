// Municipal Administrator Tab Layout
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TAB_BAR_HEIGHT, FontSize, FontWeight } from '../../src/constants';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: any }) {
  return (
    <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.adminAccent,
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
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ focused, color }) => <TabIcon name="bar-chart" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Complaints',
          tabBarIcon: ({ focused, color }) => <TabIcon name="alert-circle" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Fleet & Routes',
          tabBarIcon: ({ focused, color }) => <TabIcon name="map" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Recycling Requests',
          tabBarIcon: ({ focused, color }) => <TabIcon name="repeat" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Admin Profile',
          tabBarIcon: ({ focused, color }) => <TabIcon name="person" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
