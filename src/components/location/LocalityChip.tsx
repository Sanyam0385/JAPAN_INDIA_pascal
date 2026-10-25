// LocalityChip showing detected municipal locality with location pin
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../../lib/location/locationStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants';

interface LocalityChipProps {
  onPress?: () => void;
  locality?: string;
}

export function LocalityChip({ onPress, locality: overrideLocality }: LocalityChipProps) {
  const storeLocality = useLocationStore((s) => s.locality);
  const displayLocality = overrideLocality || storeLocality || 'Koramangala, Bengaluru';

  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Current locality: ${displayLocality}`}
    >
      <Ionicons name="location-sharp" size={14} color="#1B5E20" />
      <Text style={styles.text} numberOfLines={1}>
        {displayLocality}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: Spacing[2.5],
    maxWidth: 220,
    ...Shadow.sm,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: '#1B5E20',
  },
});
