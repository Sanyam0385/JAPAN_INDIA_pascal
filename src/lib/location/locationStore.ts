// Location Zustand store
import { create } from 'zustand';
import type { UserLocationCoords } from '../../types';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface WorkerLivePosition {
  workerId: string;
  workerName: string;
  role: 'formal_collector' | 'informal_picker';
  coords: UserLocationCoords;
  updatedAt: string;
}

interface LocationState {
  coords: UserLocationCoords | null;
  timestamp: number | null;
  permissionStatus: LocationPermissionStatus;
  isTracking: boolean;
  error: string | null;
  locality: string;
  shareLiveLocation: boolean;
  workerPositions: Record<string, WorkerLivePosition>;

  // Actions
  setCoords: (coords: UserLocationCoords) => void;
  setPermissionStatus: (status: LocationPermissionStatus) => void;
  setTracking: (tracking: boolean) => void;
  setError: (error: string | null) => void;
  setLocality: (locality: string) => void;
  setShareLiveLocation: (enabled: boolean) => void;
  updateWorkerPosition: (worker: WorkerLivePosition) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  timestamp: null,
  permissionStatus: 'undetermined',
  isTracking: false,
  error: null,
  locality: '',
  shareLiveLocation: false,
  workerPositions: {
    'demo-collector-1': {
      workerId: 'demo-collector-1',
      workerName: 'Ramesh Kumar',
      role: 'formal_collector',
      coords: {
        latitude: 12.9352,
        longitude: 77.6245,
        accuracy: 10,
        heading: 90,
        speed: 18,
        timestamp: Date.now(),
      },
      updatedAt: new Date().toISOString(),
    },
    'demo-picker-1': {
      workerId: 'demo-picker-1',
      workerName: 'Lakshmi Bai',
      role: 'informal_picker',
      coords: {
        latitude: 12.9328,
        longitude: 77.6310,
        accuracy: 8,
        heading: 45,
        speed: 4,
        timestamp: Date.now(),
      },
      updatedAt: new Date().toISOString(),
    },
  },

  setCoords: (coords) =>
    set({
      coords,
      timestamp: coords.timestamp ?? Date.now(),
      error: null,
    }),

  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),

  setTracking: (isTracking) => set({ isTracking }),

  setError: (error) => set({ error }),

  setLocality: (locality) => set({ locality }),

  setShareLiveLocation: (shareLiveLocation) => set({ shareLiveLocation }),

  updateWorkerPosition: (worker) =>
    set((state) => ({
      workerPositions: {
        ...state.workerPositions,
        [worker.workerId]: worker,
      },
    })),

  clearLocation: () =>
    set({
      coords: null,
      timestamp: null,
      isTracking: false,
      error: null,
    }),
}));
