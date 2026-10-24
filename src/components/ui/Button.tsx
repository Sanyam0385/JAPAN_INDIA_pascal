// Reusable Button component
import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, MIN_TOUCH_TARGET } from '../../constants';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' || variant === 'success' ? Colors.textInverse : Colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  iconLeft: { marginRight: Spacing[2] },
  iconRight: { marginLeft: Spacing[2] },

  // Sizes
  size_sm: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1.5], borderRadius: BorderRadius.base },
  size_md: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] },
  size_lg: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[3.5] },
  size_xl: { paddingHorizontal: Spacing[8], paddingVertical: Spacing[4] },

  // Variants
  variant_primary: { backgroundColor: Colors.primary },
  variant_secondary: { backgroundColor: Colors.mintLight },
  variant_outline: { backgroundColor: Colors.transparent, borderWidth: 1.5, borderColor: Colors.primary },
  variant_ghost: { backgroundColor: Colors.transparent },
  variant_danger: { backgroundColor: Colors.error },
  variant_success: { backgroundColor: Colors.success },

  // Labels
  label: { fontWeight: FontWeight.semibold },
  label_primary: { color: Colors.textInverse },
  label_secondary: { color: Colors.primary },
  label_outline: { color: Colors.primary },
  label_ghost: { color: Colors.primary },
  label_danger: { color: Colors.textInverse },
  label_success: { color: Colors.textInverse },

  labelSize_sm: { fontSize: FontSize.sm },
  labelSize_md: { fontSize: FontSize.base },
  labelSize_lg: { fontSize: FontSize.md },
  labelSize_xl: { fontSize: FontSize.lg },
});
