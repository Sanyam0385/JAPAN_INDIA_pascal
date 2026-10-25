// CIRCULO GPS Movement Simulator Store: Evaluator & Judge Multi-Scenario Control
import { create } from 'zustand';
import { LatLng, distance, bearing, formatDistance, formatDuration } from '../maps/geo';
import { locationApi } from '../api/locationApi';
import { collectorRouteApi } from '../api/collectorRouteApi';
import { notificationsApi } from '../api/notificationsApi';

export type SimulatorScenario = 'collector_route' | 'picker_approach' | 'roadblock_broadcast';
export type SimulatorStatus = 'idle' | 'running' | 'paused' | 'completed';

// Doorstep target (Priya Sharma, Koramangala 4th Block)
const PRIYA_DOORSTEP: LatLng = {
  latitude: 12.9345,
  longitude: 77.6245,
};

// Roadblock location (80ft Road, Ward 151)
export const ROADBLOCK_LOCATION: LatLng = {
  latitude: 12.9372,
  longitude: 77.6258,
};

// Interpolate waypoints into smooth micro-steps
function interpolateWaypoints(waypoints: LatLng[], stepDistanceM: number = 20): LatLng[] {
  const result: LatLng[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const dist = distance(start, end);
    const steps = Math.max(1, Math.round(dist / stepDistanceM));
    for (let s = 0; s < steps; s++) {
      const fraction = s / steps;
      result.push({
        latitude: start.latitude + (end.latitude - start.latitude) * fraction,
        longitude: start.longitude + (end.longitude - start.longitude) * fraction,
      });
    }
  }
  result.push(waypoints[waypoints.length - 1]);
  return result;
}

// 1. Scenario: Collector Ramesh driving Route 3A (Depot -> Koramangala Stops -> Transfer Station)
const COLLECTOR_WAYPOINTS: LatLng[] = [
  { latitude: 12.9360, longitude: 77.6210 }, // Depot
  { latitude: 12.9352, longitude: 77.6230 },
  { latitude: 12.9345, longitude: 77.6245 }, // Stop 1 (#42 Koramangala 4th Block)
  { latitude: 12.9335, longitude: 77.6265 },
  { latitude: 12.9320, longitude: 77.6290 }, // Stop 2 (#17 8th Main)
  { latitude: 12.9340, longitude: 77.6315 },
  { latitude: 12.9365, longitude: 77.6325 },
  { latitude: 12.9380, longitude: 77.6320 }, // Stop 3 (#89 1st Cross)
  { latitude: 12.9390, longitude: 77.6305 },
  { latitude: 12.9380, longitude: 77.6290 }, // Ward 151 Transfer Station
];

// 2. Scenario: Picker Meena approaching Priya's home (850m away -> Priya's Doorstep)
const PICKER_WAYPOINTS: LatLng[] = [
  { latitude: 12.9410, longitude: 77.6305 }, // 850m away
  { latitude: 12.9395, longitude: 77.6292 }, // 650m away
  { latitude: 12.9385, longitude: 77.6280 }, // 520m away (approaching threshold)
  { latitude: 12.9370, longitude: 77.6265 }, // 380m away (<500m alert zone!)
  { latitude: 12.9358, longitude: 77.6254 }, // 200m away
  { latitude: 12.9349, longitude: 77.6248 }, // 60m away
  { latitude: 12.9345, longitude: 77.6245 }, // Doorstep Arrival!
];

// 3. Scenario: Emergency Roadblock & Fleet Diversion
const ROADBLOCK_DIVERT_WAYPOINTS: LatLng[] = [
  { latitude: 12.9380, longitude: 77.6240 }, // Approaching 80ft Rd
  { latitude: 12.9378, longitude: 77.6248 }, // Roadblock spotted!
  { latitude: 12.9365, longitude: 77.6250 }, // Turn onto 1st Cross South
  { latitude: 12.9350, longitude: 77.6255 }, // Diverting safely
  { latitude: 12.9345, longitude: 77.6270 }, // Reconnected to alternate corridor
];

export const SCENARIO_PATHS: Record<SimulatorScenario, LatLng[]> = {
  collector_route: interpolateWaypoints(COLLECTOR_WAYPOINTS, 25),
  picker_approach: interpolateWaypoints(PICKER_WAYPOINTS, 20),
  roadblock_broadcast: interpolateWaypoints(ROADBLOCK_DIVERT_WAYPOINTS, 20),
};

interface SimulatorStateStore {
  scenario: SimulatorScenario;
  status: SimulatorStatus;
  speed: 1 | 5 | 10;
  currentIndex: number;
  totalPoints: number;
  currentCoord: LatLng | null;
  heading: number;
  speedKmh: number;
  infoMessage: string;
  isRoadblockActive: boolean;

  // Actions
  setScenario: (scenario: SimulatorScenario) => void;
  setSpeed: (speed: 1 | 5 | 10) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

let timerRef: any = null;

export const useSimulatorStore = create<SimulatorStateStore>((set, get) => ({
  scenario: 'picker_approach',
  status: 'idle',
  speed: 5,
  currentIndex: 0,
  totalPoints: SCENARIO_PATHS.picker_approach.length,
  currentCoord: SCENARIO_PATHS.picker_approach[0],
  heading: 140,
  speedKmh: 4.5,
  infoMessage: 'Select a scenario and tap Start to simulate live GPS movement.',
  isRoadblockActive: false,

  setScenario: (scenario: SimulatorScenario) => {
    const path = SCENARIO_PATHS[scenario];
    if (timerRef) {
      clearInterval(timerRef);
      timerRef = null;
    }
    set({
      scenario,
      status: 'idle',
      currentIndex: 0,
      totalPoints: path.length,
      currentCoord: path[0],
      heading: scenario === 'collector_route' ? 90 : 140,
      speedKmh: scenario === 'collector_route' ? 22 : 4.5,
      infoMessage:
        scenario === 'collector_route'
          ? 'Scenario: Ramesh driving Compactor Truck along Ward 151 stops.'
          : scenario === 'picker_approach'
          ? 'Scenario: Meena approaching Priya Sharma doorstep with recyclable cart.'
          : 'Scenario: Emergency Civic Broadcast & Fleet Diversion around 80ft Road.',
      isRoadblockActive: scenario === 'roadblock_broadcast',
    });
  },

  setSpeed: (speed: 1 | 5 | 10) => {
    set({ speed });
    // If currently running, restart timer with new interval
    if (get().status === 'running') {
      get().start();
    }
  },

  start: () => {
    if (timerRef) clearInterval(timerRef);

    const speed = get().speed;
    // 1x = 1000ms tick, 5x = 400ms tick, 10x = 200ms tick
    const intervalMs = speed === 1 ? 1000 : speed === 5 ? 400 : 200;

    set({ status: 'running' });

    // Handle initial broadcast for roadblock scenario
    if (get().scenario === 'roadblock_broadcast' && !get().isRoadblockActive) {
      set({ isRoadblockActive: true });
      notificationsApi.createNotification({
        userId: 'demo-household-1',
        title: '🚨 Urgent: Civic Roadblock on 80ft Road',
        body: 'Severe water main repair on 80ft Road. All collection trucks routed via 1st Cross.',
        message: 'Severe water main repair on 80ft Road. All collection trucks routed via 1st Cross.',
        type: 'urgent',
        isRead: false,
      }).catch(() => {});
    }

    timerRef = setInterval(() => {
      get().tick();
    }, intervalMs);
  },

  pause: () => {
    if (timerRef) {
      clearInterval(timerRef);
      timerRef = null;
    }
    set({ status: 'paused' });
  },

  reset: () => {
    if (timerRef) {
      clearInterval(timerRef);
      timerRef = null;
    }
    const path = SCENARIO_PATHS[get().scenario];
    set({
      status: 'idle',
      currentIndex: 0,
      currentCoord: path[0],
      infoMessage: 'Simulation reset to beginning. Tap Start to replay.',
      isRoadblockActive: false,
    });
  },

  tick: () => {
    const { scenario, currentIndex, speed } = get();
    const path = SCENARIO_PATHS[scenario];

    if (currentIndex >= path.length - 1) {
      if (timerRef) {
        clearInterval(timerRef);
        timerRef = null;
      }
      set({
        status: 'completed',
        infoMessage:
          scenario === 'collector_route'
            ? '✓ Route completed! Truck arrived at Ward 151 Transfer Station.'
            : scenario === 'picker_approach'
            ? '✓ Arrived! Meena reached Priya\'s doorstep. Ready for collection.'
            : '✓ Diversion complete! Vehicle cleared roadblock area safely.',
      });
      return;
    }

    const nextIndex = currentIndex + 1;
    const currentPoint = path[nextIndex];
    const prevPoint = path[currentIndex];
    const head = bearing(prevPoint, currentPoint);

    // Apply live GPS updates to locationApi (bypassing privacy throttle for demo simulation)
    if (scenario === 'collector_route') {
      const calcSpeed = Math.round(22 * (speed === 10 ? 2 : 1));
      locationApi.upsertLiveLocation(
        {
          userId: 'demo-collector-1',
          role: 'formal_collector',
          name: 'Ramesh Kumar',
          vehicleNumber: 'KA-01-EA-4412',
          ward: 'Ward 151 (Koramangala)',
          lat: currentPoint.latitude,
          lng: currentPoint.longitude,
          heading: head,
          speed: calcSpeed,
        },
        true
      );

      // Proximity to stops
      let note = `Ramesh driving · Speed ${calcSpeed} km/h (${speed}x)`;
      if (distance(currentPoint, { latitude: 12.9345, longitude: 77.6245 }) < 40) {
        note = 'Stop #1 (#42 Koramangala) reached! Waste collected ✓';
      } else if (distance(currentPoint, { latitude: 12.9320, longitude: 77.6290 }) < 40) {
        note = 'Stop #2 (8th Main) reached! Waste collected ✓';
      } else if (distance(currentPoint, { latitude: 12.9380, longitude: 77.6320 }) < 40) {
        note = 'Stop #3 (1st Cross) reached! Waste collected ✓';
      }

      set({
        currentIndex: nextIndex,
        currentCoord: currentPoint,
        heading: head,
        speedKmh: calcSpeed,
        infoMessage: note,
      });
    } else if (scenario === 'picker_approach') {
      const distToDoorstep = distance(currentPoint, PRIYA_DOORSTEP);
      const calcSpeed = Math.round(4.5 * (speed === 10 ? 2 : 1));

      locationApi.upsertLiveLocation(
        {
          userId: 'demo-picker-1',
          role: 'informal_picker',
          name: 'Meena Devi',
          vehicleNumber: 'Hand-cart #08',
          ward: 'Ward 151 (Koramangala)',
          lat: currentPoint.latitude,
          lng: currentPoint.longitude,
          heading: head,
          speed: calcSpeed,
        },
        true
      );

      let note = `Meena is ${formatDistance(distToDoorstep)} away (${formatDuration(Math.round(distToDoorstep / 1.25))})`;
      if (distToDoorstep <= 40) {
        note = '🏠 Arrived at doorstep (42, 5th Cross)! Ringing bell.';
      } else if (distToDoorstep <= 500) {
        note = `🔔 Approaching alert active! (${formatDistance(distToDoorstep)} away)`;
      }

      set({
        currentIndex: nextIndex,
        currentCoord: currentPoint,
        heading: head,
        speedKmh: calcSpeed,
        infoMessage: note,
      });
    } else {
      // Roadblock diversion
      const calcSpeed = Math.round(18 * (speed === 10 ? 2 : 1));
      locationApi.upsertLiveLocation(
        {
          userId: 'fleet-1',
          role: 'formal_collector',
          name: 'Ramesh Kumar',
          vehicleNumber: 'KA-01-EA-4412',
          ward: 'Ward 151 (Koramangala)',
          lat: currentPoint.latitude,
          lng: currentPoint.longitude,
          heading: head,
          speed: calcSpeed,
        },
        true
      );

      set({
        currentIndex: nextIndex,
        currentCoord: currentPoint,
        heading: head,
        speedKmh: calcSpeed,
        infoMessage: `🚨 Diverting around 80ft Road roadblock · Speed ${calcSpeed} km/h`,
      });
    }
  },
}));
