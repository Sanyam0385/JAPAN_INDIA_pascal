import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, TAB_BAR_HEIGHT } from '../../src/constants';
import { useAppStore } from '../../src/stores/appStore';

export default function CollectorLayout() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const unreadNotifications = useAppStore(s => s.unreadNotifications);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.collectorAccent,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: t('tabs.today', 'Today'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.today', 'Today')}
            </Text>
          ),
          tabBarIcon: ({ color, size }: { color: any; size: number }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          title: t('tabs.route', 'Route'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.route', 'Route')}
            </Text>
          ),
          tabBarIcon: ({ color, size }: { color: any; size: number }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tabs.tasks', 'Tasks'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.tasks', 'Tasks')}
            </Text>
          ),
          tabBarIcon: ({ color, size }: { color: any; size: number }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: t('tabs.earnings', 'Earnings'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.earnings', 'Earnings')}
            </Text>
          ),
          tabBarIcon: ({ color, size }: { color: any; size: number }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
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
          tabBarIcon: ({ color, size }: { color: any; size: number }) => (
            <View>
              <Ionicons name="person" size={size} color={color} />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
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
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 9999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabelText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
});
