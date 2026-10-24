// Header component for screens
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, HEADER_HEIGHT } from '../../constants';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  subtitle?: string;
  backgroundColor?: string;
  lightContent?: boolean;
}

export function Header({
  title,
  showBack = false,
  rightAction,
  subtitle,
  backgroundColor = Colors.surface,
  lightContent = false,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top, backgroundColor },
    ]}>
      <StatusBar
        barStyle={lightContent ? 'light-content' : 'dark-content'}
      />
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={lightContent ? Colors.textInverse : Colors.textPrimary}
            />
          </TouchableOpacity>
        ) : <View style={styles.placeholder} />}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, lightContent && styles.titleLight]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, lightContent && styles.subtitleLight]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightAction}>
          {rightAction ?? <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
}

// Green brand header for dashboard screens
export function BrandHeader({
  title,
  subtitle,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}) {
  return (
    <Header
      title={title}
      subtitle={subtitle}
      rightAction={rightAction}
      backgroundColor={Colors.primary}
      lightContent
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: Spacing[4],
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { width: 36 },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  titleLight: { color: Colors.textInverse },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  subtitleLight: { color: Colors.mintLight },
  rightAction: {
    width: 36,
    alignItems: 'flex-end',
  },
});
