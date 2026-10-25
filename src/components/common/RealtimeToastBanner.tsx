// In-app Realtime Toast Notification Banner
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useToastStore } from '../../stores/toastStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants';

export const RealtimeToastBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentToast, hideToast } = useToastStore();
  const slideAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (currentToast) {
      // Trigger subtle haptic pulse
      try {
        Haptics.notificationAsync(
          currentToast.type === 'alert'
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
      } catch {}

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
        speed: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -140,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [currentToast, slideAnim]);

  if (!currentToast) return null;

  const getBorderColor = () => {
    switch (currentToast.type) {
      case 'success':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'alert':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (currentToast.icon) return currentToast.icon as any;
    switch (currentToast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'alert-circle';
      case 'alert':
        return 'warning';
      default:
        return 'notifications';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + Spacing[1], 16),
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: getBorderColor() }]}
        activeOpacity={0.9}
        onPress={() => {
          if (currentToast.onPress) currentToast.onPress();
          hideToast();
        }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={getIconName()} size={24} color={getBorderColor()} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentToast.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {currentToast.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={hideToast}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadow.lg,
    elevation: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  closeBtn: {
    padding: Spacing[1],
  },
});
