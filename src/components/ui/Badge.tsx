// Badge component
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../constants';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], size === 'sm' && styles.small, style]}>
      <Text style={[styles.label, styles[`label_${variant}`], size === 'sm' && styles.labelSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[0.5],
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: Spacing[1.5], paddingVertical: 2 },

  success: { backgroundColor: Colors.successLight },
  warning: { backgroundColor: Colors.warningLight },
  error: { backgroundColor: Colors.errorLight },
  info: { backgroundColor: Colors.infoLight },
  neutral: { backgroundColor: Colors.gray100 },
  primary: { backgroundColor: Colors.mintPale },

  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  labelSmall: { fontSize: FontSize.xs },
  label_success: { color: Colors.success },
  label_warning: { color: Colors.warning },
  label_error: { color: Colors.error },
  label_info: { color: Colors.info },
  label_neutral: { color: Colors.textSecondary },
  label_primary: { color: Colors.primary },
});
