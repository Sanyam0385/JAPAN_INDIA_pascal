// HouseholdPin: Privacy-preserving household pin (approximate 300m circle vs exact pin)
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../../constants';
import { LatLng } from '../../../lib/maps/geo';

export interface HouseholdPinProps {
  id: string;
  coordinate: LatLng;
  name?: string;
  address?: string;
  isExact?: boolean; // false = approximate ~300m circle, true = exact doorstep pin
  approximateRadiusM?: number;
  onPress?: () => void;
}

export const HouseholdPin = memo(function HouseholdPin({
  id,
  coordinate,
  name = 'Household',
  address,
  isExact = false,
  approximateRadiusM = 300,
  onPress,
}: HouseholdPinProps) {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
    return null;
  }

  return (
    <>
      {/* Privacy Circle when approximate */}
      {!isExact && (
        <Circle
          center={coordinate}
          radius={approximateRadiusM}
          fillColor="rgba(46, 125, 50, 0.15)"
          strokeColor="rgba(46, 125, 50, 0.6)"
          strokeWidth={1.5}
          zIndex={1}
        />
      )}

      {/* Marker */}
      <Marker
        identifier={id}
        coordinate={coordinate}
        onPress={onPress}
        anchor={{ x: 0.5, y: isExact ? 1 : 0.5 }}
        zIndex={isExact ? 10 : 2}
        tracksViewChanges={false}
      >
        {isExact ? (
          <View style={styles.exactContainer}>
            {name ? (
              <View style={styles.nameBadge}>
                <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
              </View>
            ) : null}

            <View style={styles.exactPinCircle}>
              <Ionicons name="home" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.exactPinPoint} />
          </View>
        ) : (
          <View style={styles.approxBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#1B5E20" />
            <Text style={styles.approxText}>~300m Area</Text>
          </View>
        )}
      </Marker>
    </>
  );
});

const styles = StyleSheet.create({
  exactContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  nameBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: -4,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    ...Shadow.sm,
  },
  nameText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  exactPinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadow.md,
  },
  exactPinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2E7D32',
    marginTop: -1,
  },
  approxBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#81C784',
    ...Shadow.sm,
  },
  approxText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
});
