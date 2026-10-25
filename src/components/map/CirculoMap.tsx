// CirculoMap: Shared cross-platform native map component
// Uses native Google Maps on Android (works keyless in Expo Go) and Apple Maps on iOS
import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import MapView, {
  Polyline,
  Circle,
  Region,
  EdgePadding,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT } from '../../constants';
import { LatLng } from '../../lib/maps/geo';
import { mapConfig, DEFAULT_MAP_REGION } from '../../lib/maps/config';
import { useAuthStore } from '../../stores/authStore';
import { DemoSimulatorWidget } from '../simulator/DemoSimulatorWidget';

export interface CirculoMapRef {
  recenter: (coord?: LatLng) => void;
  fitAll: (coords?: LatLng[]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getMapView: () => MapView | null;
}

export interface MapCircle {
  id: string;
  center: LatLng;
  radius: number; // in meters
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface CirculoMapProps {
  initialRegion?: Region;
  userLocation?: LatLng | null;
  routeGeometry?: LatLng[];
  isFallbackRoute?: boolean;
  routeColor?: string;
  routeWidth?: number;
  routeLineDashPattern?: number[];
  circles?: MapCircle[];
  children?: React.ReactNode;
  style?: ViewStyle;
  showControls?: boolean;
  showRecenterButton?: boolean;
  showFitAllButton?: boolean;
  showZoomControls?: boolean;
  showSimulator?: boolean; // Evaluator Scenario GPS Simulator
  controlsTopOffset?: number; // Margin from top edge (e.g. below radius chips)
  simulatorPositionStyle?: object; // Custom position for GPS simulator pill
  onRegionChangeComplete?: (region: Region) => void;
  onLongPress?: (coord: LatLng) => void;
  onPress?: (coord: LatLng) => void;
  markersToFit?: LatLng[];
  gloveFriendly?: boolean; // Touch targets >= 56px for waste collectors
}

export const CirculoMap = forwardRef<CirculoMapRef, CirculoMapProps>(function CirculoMap(
  {
    initialRegion = DEFAULT_MAP_REGION,
    userLocation,
    routeGeometry,
    isFallbackRoute = false,
    routeColor,
    routeWidth = 5,
    routeLineDashPattern,
    circles,
    children,
    style,
    showControls = true,
    showRecenterButton = true,
    showFitAllButton = true,
    showZoomControls = true,
    showSimulator = true,
    controlsTopOffset,
    simulatorPositionStyle,
    onRegionChangeComplete,
    onLongPress,
    onPress,
    markersToFit,
    gloveFriendly = false,
  },
  ref
) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDemoMode } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(initialRegion);

  const btnSize = gloveFriendly ? 56 : 46;
  const iconSize = gloveFriendly ? 26 : 22;

  // Recenter on target or user's active coordinate
  const recenter = useCallback(
    (coord?: LatLng) => {
      const target = coord || userLocation;
      if (!target || !mapRef.current) return;

      mapRef.current.animateToRegion(
        {
          latitude: target.latitude,
          longitude: target.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500
      );
    },
    [userLocation]
  );

  const fitAll = useCallback(
    (coordsToFit?: LatLng[]) => {
      const list = coordsToFit || markersToFit || [];
      if (!mapRef.current || list.length === 0) return;

      const validCoords = list.filter(
        (c) => c && typeof c.latitude === 'number' && typeof c.longitude === 'number'
      );

      if (validCoords.length === 0) return;

      if (validCoords.length === 1) {
        recenter(validCoords[0]);
        return;
      }

      const padding: EdgePadding = {
        top: gloveFriendly ? 100 : 80,
        right: gloveFriendly ? 80 : 60,
        bottom: gloveFriendly ? 110 : 90,
        left: gloveFriendly ? 80 : 60,
      };

      mapRef.current.fitToCoordinates(validCoords, {
        edgePadding: padding,
        animated: true,
      });
    },
    [markersToFit, recenter, gloveFriendly]
  );

  const zoomIn = useCallback(() => {
    if (!mapRef.current || !currentRegion) return;
    mapRef.current.animateToRegion(
      {
        ...currentRegion,
        latitudeDelta: currentRegion.latitudeDelta / 2,
        longitudeDelta: currentRegion.longitudeDelta / 2,
      },
      300
    );
  }, [currentRegion]);

  const zoomOut = useCallback(() => {
    if (!mapRef.current || !currentRegion) return;
    mapRef.current.animateToRegion(
      {
        ...currentRegion,
        latitudeDelta: Math.min(100, currentRegion.latitudeDelta * 2),
        longitudeDelta: Math.min(100, currentRegion.longitudeDelta * 2),
      },
      300
    );
  }, [currentRegion]);

  useImperativeHandle(
    ref,
    () => ({
      recenter,
      fitAll,
      zoomIn,
      zoomOut,
      getMapView: () => mapRef.current,
    }),
    [recenter, fitAll, zoomIn, zoomOut]
  );

  // Evaluator simulator pill only in __DEV__ or demo mode
  const canShowSimulator = showSimulator !== false && (__DEV__ || isDemoMode);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={mapConfig.provider}
        mapType={mapConfig.mapType}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={(region) => {
          setCurrentRegion(region);
          if (onRegionChangeComplete) onRegionChangeComplete(region);
        }}
        onLongPress={(e) => {
          if (onLongPress && e.nativeEvent?.coordinate) {
            onLongPress(e.nativeEvent.coordinate);
          }
        }}
        onPress={(e) => {
          if (onPress && e.nativeEvent?.coordinate) {
            onPress(e.nativeEvent.coordinate);
          }
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={true}
        pitchEnabled={false}
      >
        {/* Route Polyline */}
        {routeGeometry && routeGeometry.length > 1 && (
          <Polyline
            coordinates={routeGeometry}
            strokeColor={routeColor || (isFallbackRoute ? '#FF9800' : '#1B5E20')}
            strokeWidth={routeWidth}
            lineDashPattern={routeLineDashPattern || (isFallbackRoute ? [10, 6] : undefined)}
            zIndex={5}
          />
        )}

        {/* Hotspot Density Circles */}
        {circles &&
          circles.map((c) => (
            <Circle
              key={c.id}
              center={c.center}
              radius={c.radius}
              fillColor={c.fillColor || 'rgba(211, 47, 47, 0.28)'}
              strokeColor={c.strokeColor || '#D32F2F'}
              strokeWidth={c.strokeWidth || 1.5}
              zIndex={2}
            />
          ))}

        {/* Child Markers */}
        {children}
      </MapView>

      {/* Approximate Route Fallback Indicator */}
      {isFallbackRoute && routeGeometry && routeGeometry.length > 1 && (
        <View style={styles.fallbackBadge} pointerEvents="none">
          <Ionicons name="information-circle-outline" size={13} color="#E65100" />
          <Text style={styles.fallbackBadgeText}>
            {t('map.approx', 'approx')}
          </Text>
        </View>
      )}

      {/* Floating Map Controls Overlay (High Contrast & Sunlight-Proof) */}
      {showControls && (
        <View
          style={[
            styles.controlsColumn,
            { top: controlsTopOffset ?? 12, right: 12 },
          ]}
          pointerEvents="box-none"
        >
          {showRecenterButton && (
            <TouchableOpacity
              style={[
                styles.controlBtn,
                { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              ]}
              onPress={() => recenter()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('map.recenter', 'Recenter on my location')}
            >
              <Ionicons name="locate" size={iconSize} color="#1B5E20" />
            </TouchableOpacity>
          )}

          {showFitAllButton && (
            <TouchableOpacity
              style={[
                styles.controlBtn,
                { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              ]}
              onPress={() => fitAll()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('map.fitAll', 'Fit all markers')}
            >
              <Ionicons name="scan" size={iconSize} color="#1B5E20" />
            </TouchableOpacity>
          )}

          {showZoomControls && (
            <View style={styles.zoomGroup}>
              <TouchableOpacity
                style={[
                  styles.zoomBtn,
                  { width: btnSize, height: btnSize / 1.2 },
                ]}
                onPress={zoomIn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('map.zoomIn', 'Zoom in')}
              >
                <Ionicons name="add" size={iconSize} color="#212121" />
              </TouchableOpacity>
              <View style={styles.zoomDivider} />
              <TouchableOpacity
                style={[
                  styles.zoomBtn,
                  { width: btnSize, height: btnSize / 1.2 },
                ]}
                onPress={zoomOut}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('map.zoomOut', 'Zoom out')}
              >
                <Ionicons name="remove" size={iconSize} color="#212121" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Evaluator Scenario GPS Simulator Widget: Bottom-Left above tab bar, only in demo/__DEV__ */}
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
    backgroundColor: '#E0E0E0',
    position: 'relative',
  },
  controlsColumn: {
    position: 'absolute',
    alignItems: 'center',
    gap: Spacing[2.5],
    zIndex: 50,
  },
  controlBtn: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    ...Shadow.md,
    elevation: 4,
  },
  zoomGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    ...Shadow.md,
    elevation: 4,
  },
  zoomBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  fallbackBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    zIndex: 40,
    ...Shadow.sm,
  },
  fallbackBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#E65100',
    textTransform: 'uppercase',
  },
});
