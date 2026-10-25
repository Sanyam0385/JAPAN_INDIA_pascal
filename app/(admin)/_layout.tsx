// Municipal Administrator Tab Layout
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, TAB_BAR_HEIGHT, FontSize, FontWeight } from '../../src/constants';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: any }) {
  return (
    <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
  );
}

export default function AdminLayout() {
  const { t, i18n } = useTranslation();

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
          title: t('tabs.overview', 'Overview'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.overview', 'Overview')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="bar-chart" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: t('tabs.complaints', 'Complaints'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.complaints', 'Complaints')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="alert-circle" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: t('tabs.routes', 'Routes'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.routes', 'Routes')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="map" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: t('tabs.requests', 'Requests'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.requests', 'Requests')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="repeat" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile', 'Profile'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.profile', 'Profile')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="person" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});
