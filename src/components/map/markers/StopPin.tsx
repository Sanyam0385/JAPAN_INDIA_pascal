// StopPin: Numbered municipal collection stop pin with state-based styling
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../../constants';
import { LatLng } from '../../../lib/maps/geo';

export type StopState = 'pending' | 'current' | 'done' | 'skipped';

export interface StopPinProps {
  id: string;
  sequence: number; // 1, 2, 3...
  coordinate: LatLng;
  state: StopState;
  label?: string;
  onPress?: () => void;
}

const STATE_CONFIG: Record<
  StopState,
  { bg: string; text: string; border: string; icon?: keyof typeof Ionicons.glyphMap }
> = {
  current: { bg: '#2E7D32', text: '#FFFFFF', border: '#FFD700', icon: 'navigate' },
  pending: { bg: '#1565C0', text: '#FFFFFF', border: '#FFFFFF' },
  done: { bg: '#9E9E9E', text: '#FFFFFF', border: '#E0E0E0', icon: 'checkmark' },
  skipped: { bg: '#E65100', text: '#FFFFFF', border: '#FFE082', icon: 'close' },
};

export const StopPin = memo(function StopPin({
  id,
  sequence,
  coordinate,
  state = 'pending',
  label,
  onPress,
}: StopPinProps) {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    return null;
  }

  const config = STATE_CONFIG[state] || STATE_CONFIG.pending;
  const isCurrent = state === 'current';

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={isCurrent ? 30 : 10}
      tracksViewChanges={false}
    >
      <View style={[styles.container, isCurrent && styles.containerCurrent]}>
        {label ? (
          <View style={[styles.labelPill, isCurrent && styles.labelPillCurrent]}>
            <Text style={[styles.labelText, isCurrent && styles.labelTextCurrent]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ) : null}

        {/* Numbered Pin Circle */}
        <View style={[styles.pinCircle, { backgroundColor: config.bg, borderColor: config.border }]}>
          {config.icon && state !== 'current' ? (
            <Ionicons name={config.icon} size={16} color="#FFFFFF" />
          ) : (
            <Text style={styles.numberText}>{sequence}</Text>
          )}
        </View>

        <View style={[styles.pinPoint, { borderTopColor: config.bg }]} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  containerCurrent: {
    transform: [{ scale: 1.15 }],
  },
  labelPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: -4,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Shadow.sm,
  },
  labelPillCurrent: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  labelText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#424242',
  },
  labelTextCurrent: {
    color: '#1B5E20',
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...Shadow.md,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
