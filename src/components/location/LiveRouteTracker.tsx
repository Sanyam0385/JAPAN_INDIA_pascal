// LiveRouteTracker: Animated real-time route & beacon tracker for en-route jobs
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { liveLocationService, LocationPayload } from '../../lib/realtime/liveLocationService';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';

interface LiveRouteTrackerProps {
  jobId: string;
  pickerName?: string;
  initialDistanceKm?: number;
}

export const LiveRouteTracker: React.FC<LiveRouteTrackerProps> = ({
  jobId,
  pickerName = 'Collector',
  initialDistanceKm = 1.2,
}) => {
  const [liveLocation, setLiveLocation] = useState<LocationPayload | null>(null);
  const [lastPingAgoSec, setLastPingAgoSec] = useState<number>(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsating radar animation
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();

    // Subscribe to realtime location broadcast
    const unsubscribe = liveLocationService.subscribeToJobLocation(jobId, (loc) => {
      setLiveLocation(loc);
      setLastPingAgoSec(0);
    });

    const timer = setInterval(() => {
      setLastPingAgoSec((prev) => prev + 1);
    }, 1000);

    return () => {
      anim.stop();
      unsubscribe();
      clearInterval(timer);
    };
  }, [jobId, pulseAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.leftGroup}>
          <Animated.View style={[styles.beaconDot, { opacity: pulseAnim }]} />
          <Text style={styles.title}>
            {pickerName} is en route
          </Text>
        </View>

        <View style={styles.badge}>
          <Ionicons name="radio" size={12} color="#1B5E20" />
          <Text style={styles.badgeText}>
            {liveLocation ? 'Live GPS Active' : 'Connecting to GPS...'}
          </Text>
        </View>
      </View>

      <Text style={styles.subtext}>
        {liveLocation
          ? `Last GPS ping: ${lastPingAgoSec}s ago • Heading to doorstep`
          : `Estimated distance: ~${initialDistanceKm.toFixed(1)} km away (~6 mins)`}
      </Text>

      {/* Progress track bar */}
      <View style={styles.trackBar}>
        <View style={styles.trackFill} />
        <View style={styles.pickerMarker}>
          <Ionicons name="bicycle" size={14} color="#FFFFFF" />
        </View>
        <View style={styles.homeMarker}>
          <Ionicons name="home" size={12} color="#1B5E20" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginVertical: Spacing[2],
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
  },
  beaconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C8E6C9',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  subtext: {
    fontSize: FontSize.xs,
    color: '#2E7D32',
    marginBottom: Spacing[2],
  },
  trackBar: {
    height: 6,
    backgroundColor: '#C8E6C9',
    borderRadius: 3,
    position: 'relative',
    marginTop: 8,
    marginBottom: 4,
  },
  trackFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  pickerMarker: {
    position: 'absolute',
    left: '60%',
    top: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  homeMarker: {
    position: 'absolute',
    right: 0,
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
