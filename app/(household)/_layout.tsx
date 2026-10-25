// Household tab layout with localized unclipped tab labels and reactive language switching
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, TAB_BAR_HEIGHT, FontSize, FontWeight } from '../../src/constants';
import { useAppStore } from '../../src/stores/appStore';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: any }) {
  return (
    <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />
  );
}

export default function HouseholdLayout() {
  const { t, i18n } = useTranslation();
  const unread = useAppStore(s => s.unreadNotifications);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          paddingBottom: 6,
          paddingTop: 6,
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingHorizontal: 1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.home', 'Home'),
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.tabLabelText, { color }]}
            >
              {t('tabs.home', 'Home')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar', 'Cal'),
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.tabLabelText, { color }]}
            >
              {t('tabs.calendar', 'Cal')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="calendar" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recycle"
        options={{
          title: t('tabs.recycle', 'Sell'),
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.tabLabelText, { color }]}
            >
              {t('tabs.recycle', 'Sell')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.recycleTab}>
              <Ionicons name="refresh-circle" size={28} color={focused ? Colors.primary : Colors.gray500} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t('tabs.learn', 'Learn'),
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.tabLabelText, { color }]}
            >
              {t('tabs.learn', 'Learn')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="school" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community', 'Events'),
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.tabLabelText, { color }]}
            >
              {t('tabs.community', 'Events')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="people" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile', 'Profile'),
          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.tabLabelText, { color }]}
            >
              {t('tabs.profile', 'Profile')}
            </Text>
          ),
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
      <Tabs.Screen name="tracking" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  recycleTab: { alignItems: 'center', justifyContent: 'center' },
  tabLabelText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
