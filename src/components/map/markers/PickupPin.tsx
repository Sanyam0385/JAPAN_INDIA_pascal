// PickupPin: Waste material pin with icon, color coding & weight badge
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../../constants';
import { LatLng } from '../../../lib/maps/geo';

export interface PickupPinProps {
  id: string;
  coordinate: LatLng;
  material: string;
  estimatedKg: number;
  ratePerKg?: number;
  title?: string;
  selected?: boolean;
  onPress?: () => void;
}

const MATERIAL_COLORS: Record<string, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  paper: { bg: '#1E88E5', icon: 'document-text' },
  cardboard: { bg: '#8D6E63', icon: 'cube' },
  plastic: { bg: '#FB8C00', icon: 'water' },
  metal: { bg: '#546E7A', icon: 'hardware-chip' },
  glass: { bg: '#00ACC1', icon: 'wine' },
  electronics: { bg: '#8E24AA', icon: 'phone-portrait' },
  organic: { bg: '#43A047', icon: 'leaf' },
  hazardous: { bg: '#E53935', icon: 'warning' },
  other: { bg: '#757575', icon: 'help-circle' },
};

export const PickupPin = memo(function PickupPin({
  id,
  coordinate,
  material,
  estimatedKg,
  ratePerKg,
  title,
  selected = false,
  onPress,
}: PickupPinProps) {
  const normMat = (material || 'other').toLowerCase();
  const config = MATERIAL_COLORS[normMat] || MATERIAL_COLORS.other;

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={[styles.container, selected && styles.containerSelected]}>
        {/* Weight Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{estimatedKg} kg</Text>
        </View>

        {/* Pin Body */}
        <View style={[styles.pinCircle, { backgroundColor: config.bg }, selected && styles.pinSelected]}>
          <Ionicons name={config.icon} size={18} color="#FFFFFF" />
        </View>

        {/* Pin Point */}
        <View style={[styles.pinPoint, { borderTopColor: config.bg }]} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  containerSelected: {
    transform: [{ scale: 1.15 }],
  },
  badge: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: -4,
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...Shadow.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  pinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Shadow.md,
  },
  pinSelected: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
