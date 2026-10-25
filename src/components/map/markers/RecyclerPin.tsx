// RecyclerPin: Certified recycling facility / MRF marker
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../../constants';
import { LatLng } from '../../../lib/maps/geo';

export interface RecyclerPinProps {
  id: string;
  coordinate: LatLng;
  name: string;
  hours?: string;
  onPress?: () => void;
}

export const RecyclerPin = memo(function RecyclerPin({
  id,
  coordinate,
  name,
  hours,
  onPress,
}: RecyclerPinProps) {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    return null;
  }

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={15}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        {/* Name pill */}
        <View style={styles.namePill}>
          <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
          {hours ? <Text style={styles.hoursText}>{hours}</Text> : null}
        </View>

        {/* Pin circle */}
        <View style={styles.pinCircle}>
          <Ionicons name="business" size={18} color="#FFFFFF" />
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
    width: 120,
  },
  namePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    marginBottom: -4,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#D1C4E9',
    alignItems: 'center',
    ...Shadow.sm,
  },
  nameText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#4A148C',
  },
  hoursText: {
    fontSize: 9,
    color: '#7B1FA2',
  },
  pinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6A1B9A',
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
    borderTopColor: '#6A1B9A',
    marginTop: -1,
  },
});
