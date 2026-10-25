// Informal Picker Tab Layout
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, TAB_BAR_HEIGHT, FontSize, FontWeight } from '../../src/constants';
import { useAppStore } from '../../src/stores/appStore';

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: any }) {
  return (
    <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
  );
}

export default function PickerLayout() {
  const { t, i18n } = useTranslation();
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
          title: t('tabs.marketplace', 'Marketplace'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.marketplace', 'Marketplace')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="storefront" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t('tabs.myJobs', 'My Jobs'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.myJobs', 'My Jobs')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="briefcase" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="buyers"
        options={{
          title: t('tabs.buyers', 'Buyers'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.buyers', 'Buyers')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="business" focused={focused} color={color} />,
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
          tabBarIcon: ({ focused, color }) => <TabIcon name="cash" focused={focused} color={color} />,
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
      <Tabs.Screen
        name="navigate/[jobId]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
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
  tabLabelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});
