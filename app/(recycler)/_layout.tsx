// Recycler Role Tab Layout
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

export default function RecyclerLayout() {
  const { t, i18n } = useTranslation();
  const unread = useAppStore(s => s.unreadNotifications);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00796B',
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
        name="incoming"
        options={{
          title: t('tabs.incoming', 'Incoming'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.incoming', 'Incoming')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="archive" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weigh-in"
        options={{
          title: t('tabs.weighIn', 'Weigh-In'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.weighIn', 'Weigh-In')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="scale" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history', 'Intake History'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.history', 'Intake History')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => <TabIcon name="receipt" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.facility', 'Facility'),
          tabBarLabel: ({ color }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabLabelText, { color }]}>
              {t('tabs.facility', 'Facility')}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => (
            <View>
              <TabIcon name="business" focused={focused} color={color} />
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
  tabLabelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});
