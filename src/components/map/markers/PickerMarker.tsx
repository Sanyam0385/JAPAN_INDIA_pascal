// PickerMarker: Live waste picker / cart marker with beacon and name
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../../constants';
import { LatLng } from '../../../lib/maps/geo';

export interface PickerMarkerProps {
  id: string;
  coordinate: LatLng;
  name?: string;
  isLive?: boolean;
  isStale?: boolean;
  onPress?: () => void;
}

export const PickerMarker = memo(function PickerMarker({
  id,
  coordinate,
  name = 'Picker',
  isLive = true,
  isStale = false,
  onPress,
}: PickerMarkerProps) {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    return null;
  }

  const bgColor = isStale ? '#78909C' : '#2E7D32';

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={20}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        {/* Name pill */}
        <View style={styles.namePill}>
          {isLive && !isStale && <View style={styles.liveDot} />}
          <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
        </View>

        {/* Avatar circle */}
        <View style={[styles.avatarCircle, { backgroundColor: bgColor }]}>
          <Ionicons name="bicycle" size={20} color="#FFFFFF" />
        </View>
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  namePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    ...Shadow.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  nameText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Shadow.md,
  },
});
