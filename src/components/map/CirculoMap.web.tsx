// CirculoMap.web.tsx: Zero-tile web fallback for CIRCULO maps
// Replaces tile requests with list view & external map link to avoid forbidden tile usage
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT } from '../../constants';
import { LatLng, formatDistance } from '../../lib/maps/geo';
import { CirculoMapProps, CirculoMapRef } from './CirculoMap';
import { useAuthStore } from '../../stores/authStore';
import { DemoSimulatorWidget } from '../simulator/DemoSimulatorWidget';

export const CirculoMap = forwardRef<CirculoMapRef, CirculoMapProps>(function CirculoMapWeb(
  {
    initialRegion,
    userLocation,
    routeGeometry,
    isFallbackRoute = false,
    circles,
    children,
    style,
    markersToFit,
    showSimulator = true,
    simulatorPositionStyle,
  },
  ref
) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDemoMode } = useAuthStore();

  const centerLat = userLocation?.latitude || initialRegion?.latitude || 28.6139;
  const centerLng = userLocation?.longitude || initialRegion?.longitude || 77.2090;

  useImperativeHandle(
    ref,
    () => ({
      recenter: () => {},
      fitAll: () => {},
      zoomIn: () => {},
      zoomOut: () => {},
      getMapView: () => null,
    }),
    []
  );

  const openInGoogleMaps = () => {
    let url = `https://www.google.com/maps/search/?api=1&query=${centerLat},${centerLng}`;
    if (routeGeometry && routeGeometry.length > 1) {
      const origin = routeGeometry[0];
      const dest = routeGeometry[routeGeometry.length - 1];
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;
    }
    Linking.openURL(url).catch(() => {});
  };

  const markersList = useMemo(() => {
    const list: { id: string; lat: number; lng: number; label: string }[] = [];
    if (userLocation) {
      list.push({
        id: 'user-loc',
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        label: t('map.recenter', 'Current Position'),
      });
    }
    (markersToFit || []).forEach((m, idx) => {
      if (m && typeof m.latitude === 'number' && typeof m.longitude === 'number') {
        list.push({
          id: `marker-${idx}`,
          lat: m.latitude,
          lng: m.longitude,
          label: `Location ${idx + 1}`,
        });
      }
    });
    return list;
  }, [userLocation, markersToFit, t]);

  const canShowSimulator = showSimulator !== false && (__DEV__ || isDemoMode);

  return (
    <View style={[styles.container, style]}>
      {/* Header Banner */}
      <View style={styles.webHeader}>
        <View style={styles.headerInfo}>
          <View style={styles.badgeRow}>
            <View style={styles.webBadge}>
              <Ionicons name="desktop-outline" size={13} color="#1B5E20" />
              <Text style={styles.webBadgeText}>Web Preview</Text>
            </View>
            {isFallbackRoute && (
              <View style={styles.approxBadge}>
                <Ionicons name="information-circle-outline" size={12} color="#E65100" />
                <Text style={styles.approxBadgeText}>{t('map.approx', 'approx')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.webTitle}>
            Map view active • {markersList.length} {t('map.stops', 'Stops')}
          </Text>
          <Text style={styles.webSub}>
            Platform standard maps render in Expo Go on Android & iOS
          </Text>
        </View>

        {/* Primary CTA: Open in Google Maps */}
        <TouchableOpacity
          style={styles.openExternalBtn}
          onPress={openInGoogleMaps}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('map.openGoogleMaps', 'Open in Google Maps')}
        >
          <Ionicons name="map-outline" size={16} color="#FFFFFF" />
          <Text style={styles.openExternalText}>
            {t('map.openGoogleMaps', 'Open in Google Maps')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Markers / Stops Summary List */}
      <ScrollView
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 80 },
        ]}
      >
        <Text style={styles.sectionHeader}>
          {t('map.stops', 'Stops')} & Points of Interest
        </Text>
        {markersList.map((item, idx) => (
          <View key={item.id} style={styles.markerRow}>
            <View style={styles.markerIndexBadge}>
              <Text style={styles.markerIndexText}>{idx + 1}</Text>
            </View>
            <View style={styles.markerDetails}>
              <Text style={styles.markerLabel}>{item.label}</Text>
              <Text style={styles.markerCoords}>
                {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.directNavBtn}
              onPress={() => {
                const u = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
                Linking.openURL(u).catch(() => {});
              }}
            >
              <Ionicons name="navigate-circle-outline" size={20} color="#1B5E20" />
            </TouchableOpacity>
          </View>
        ))}

        {routeGeometry && routeGeometry.length > 1 && (
          <View style={styles.routeBox}>
            <Ionicons name="git-commit-outline" size={18} color="#1B5E20" />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeTitle}>
                Active Route • {routeGeometry.length} waypoints
              </Text>
              <Text style={styles.routeSub}>
                {isFallbackRoute
                  ? t('map.offlineRoute', 'Straight-line route (offline estimate)')
                  : 'Road navigation routed via OSRM'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Evaluator Scenario GPS Simulator Widget */}
      {canShowSimulator && (
        <DemoSimulatorWidget
          positionStyle={
            simulatorPositionStyle || {
              position: 'absolute',
              bottom: TAB_BAR_HEIGHT + insets.bottom + 12,
              left: 12,
              top: undefined,
              zIndex: 60,
            }
          }
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  webHeader: {
    backgroundColor: '#FFFFFF',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadow.sm,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 2,
  },
  webBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  webBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  approxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  approxBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#E65100',
    textTransform: 'uppercase',
  },
  webTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  webSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  openExternalBtn: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.full,
    ...Shadow.md,
  },
  openExternalText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  listContainer: {
    padding: Spacing[4],
    gap: Spacing[2.5],
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[1],
  },
  markerRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  markerIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  markerDetails: {
    flex: 1,
  },
  markerLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  markerCoords: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  directNavBtn: {
    padding: Spacing[1],
  },
  routeBox: {
    marginTop: Spacing[3],
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2.5],
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  routeTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  routeSub: {
    fontSize: 11,
    color: '#2E7D32',
    marginTop: 1,
  },
});
