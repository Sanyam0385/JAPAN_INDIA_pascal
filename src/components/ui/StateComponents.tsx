// LoadingState, EmptyState, ErrorState components
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { Button } from './Button';

// Loading State
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

// Empty State
interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '📭', title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

// Error State
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry && (
        <View style={styles.action}>
          <Button label="Try Again" onPress={onRetry} variant="outline" />
        </View>
      )}
    </View>
  );
}

// Offline Banner
export function OfflineBanner() {
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>📴 Offline — showing cached data</Text>
    </View>
  );
}

// Demo Data Banner
export function DemoDataBanner({ message }: { message?: string }) {
  return (
    <View style={styles.demoBanner}>
      <Text style={styles.demoText}>
        {message ?? '⚠️ Demo Data — Fictional records for demonstration only'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  icon: { fontSize: 48, marginBottom: Spacing[4] },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  body: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  message: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing[3],
  },
  action: { marginTop: Spacing[5] },
  offlineBanner: {
    backgroundColor: Colors.gray800,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  offlineText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  demoBanner: {
    backgroundColor: Colors.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[3],
    borderRadius: 4,
  },
  demoText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
