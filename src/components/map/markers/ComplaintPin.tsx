// ComplaintPin: Grievance and cleanliness issue alert pin
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../../constants';
import { LatLng } from '../../../lib/maps/geo';

export interface ComplaintPinProps {
  id: string;
  coordinate: LatLng;
  category?: string;
  referenceNumber?: string;
  onPress?: () => void;
}

export const ComplaintPin = memo(function ComplaintPin({
  id,
  coordinate,
  category = 'Issue',
  referenceNumber,
  onPress,
}: ComplaintPinProps) {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    return null;
  }

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={12}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        {referenceNumber ? (
          <View style={styles.refPill}>
            <Text style={styles.refText}>{referenceNumber}</Text>
          </View>
        ) : null}

        <View style={styles.pinCircle}>
          <Ionicons name="warning" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.pinPoint} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  refPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: -4,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    ...Shadow.sm,
  },
  refText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#C62828',
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadow.md,
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
    borderTopColor: '#D32F2F',
    marginTop: -1,
  },
});
