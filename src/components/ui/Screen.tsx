// Screen wrapper with safe area + scroll support
import React from 'react';
import {
  View, ScrollView, StyleSheet, ViewStyle, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, TAB_BAR_HEIGHT } from '../../constants';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  withTabBar?: boolean;
  keyboardAvoiding?: boolean;
  backgroundColor?: string;
}

export function Screen({
  children,
  scrollable = true,
  style,
  contentStyle,
  withTabBar = true,
  keyboardAvoiding = false,
  backgroundColor = Colors.background,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = scrollable ? (
    <ScrollView
      style={[styles.flex, { backgroundColor }]}
      contentContainerStyle={[
        styles.content,
        withTabBar && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[
      styles.flex,
      { backgroundColor },
      withTabBar && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
      contentStyle,
    ]}>
      {children}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor }, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing[4],
    flexGrow: 1,
  },
});
