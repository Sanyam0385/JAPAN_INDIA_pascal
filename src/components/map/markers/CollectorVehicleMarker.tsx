// CollectorVehicleMarker: Municipal collection truck with directional heading rotation
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../../constants';
import { LatLng } from '../../../lib/maps/geo';

export interface CollectorVehicleMarkerProps {
  id: string;
  coordinate: LatLng;
  heading?: number; // 0 - 360 degrees
  name?: string;
  vehicleNumber?: string;
  isStale?: boolean;
  onPress?: () => void;
}

export const CollectorVehicleMarker = memo(function CollectorVehicleMarker({
  id,
  coordinate,
  heading = 0,
  name = 'Collector Fleet',
  vehicleNumber,
  isStale = false,
  onPress,
}: CollectorVehicleMarkerProps) {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    return null;
  }

  const bgColor = isStale ? '#78909C' : '#00695C';

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={25}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        {/* Fleet label */}
        <View style={styles.labelPill}>
          <Text style={styles.labelText} numberOfLines={1}>
            {vehicleNumber || name}
          </Text>
        </View>

        {/* Directional vehicle icon */}
        <View
          style={[
            styles.vehicleIconCircle,
            { backgroundColor: bgColor, transform: [{ rotate: `${heading || 0}deg` }] },
          ]}
        >
          {/* Arrow / heading indicator */}
          <Ionicons name="navigate" size={24} color="#FFFFFF" />
        </View>
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
  },
  labelPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    ...Shadow.sm,
  },
  labelText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#00695C',
  },
  vehicleIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Shadow.md,
  },
});
