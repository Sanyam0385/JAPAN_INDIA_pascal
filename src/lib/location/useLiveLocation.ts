// Hook to access live location state and controls with automatic lifecycle cleanup
import { useEffect } from 'react';
import { useLocationStore } from './locationStore';
import { locationService } from './LocationService';
import type { UserLocationCoords } from '../../types';

export function useLiveLocation(autoTrack = false) {
  const coords = useLocationStore((s) => s.coords);
  const locality = useLocationStore((s) => s.locality);
  const isTracking = useLocationStore((s) => s.isTracking);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const error = useLocationStore((s) => s.error);
  const shareLiveLocation = useLocationStore((s) => s.shareLiveLocation);
  const setShareLiveLocation = useLocationStore((s) => s.setShareLiveLocation);

  useEffect(() => {
    if (autoTrack && shareLiveLocation) {
      locationService.startTracking();
    }
    return () => {
      // Keep running if globally active, but stop if autoTrack was requested on this component
      if (autoTrack) {
        locationService.stopTracking();
      }
    };
  }, [autoTrack, shareLiveLocation]);

  return {
    coords,
    locality,
    isTracking,
    permissionStatus,
    error,
    shareLiveLocation,
    setShareLiveLocation,
    getCurrentLocation: () => locationService.getCurrentLocation(),
    startTracking: (cb?: (c: UserLocationCoords) => void) => locationService.startTracking(cb),
    stopTracking: () => locationService.stopTracking(),
    requestPermission: () => locationService.requestPermission(),
  };
}
