// LocationStatusBadge indicator pill matching CIRCULO design system
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useLocationStore } from '../../lib/location/locationStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';

interface LocationStatusBadgeProps {
  showWhenOff?: boolean;
}

export function LocationStatusBadge({ showWhenOff = false }: LocationStatusBadgeProps) {
  const isTracking = useLocationStore((s) => s.isTracking);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTracking, pulseAnim]);

  if (!isTracking && !showWhenOff) {
    return null;
  }

  return (
    <View style={[styles.badge, isTracking ? styles.badgeActive : styles.badgeInactive]}>
      <Animated.View
        style={[
          styles.dot,
          isTracking ? styles.dotActive : styles.dotInactive,
          { opacity: isTracking ? pulseAnim : 1 },
        ]}
      />
      <Text style={[styles.text, isTracking ? styles.textActive : styles.textInactive]}>
        {isTracking ? 'Live location on' : 'Location off'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
    paddingVertical: 4,
    paddingHorizontal: Spacing[2.5],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  badgeInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    backgroundColor: '#2E7D32',
  },
  dotInactive: {
    backgroundColor: '#9E9E9E',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  textActive: {
    color: '#1B5E20',
  },
  textInactive: {
    color: '#757575',
  },
});
