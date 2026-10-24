// Card component
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
}

export function Card({ children, style, padded = true, elevated = true, variant = 'default' }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'filled' && styles.filled,
      variant === 'outlined' && styles.outlined,
      elevated && Shadow.base,
      padded && styles.padded,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filled: {
    backgroundColor: Colors.mintPale,
    borderColor: Colors.mint,
  },
  outlined: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.border,
    borderWidth: 1.5,
  },
  padded: {
    padding: Spacing[4],
  },
});
