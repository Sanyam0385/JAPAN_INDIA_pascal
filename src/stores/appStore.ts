// App-wide store for demo state, recycling requests, complaints, notifications
import { create } from 'zustand';
import type {
  RecyclingRequest, Complaint, AppNotification,
  RecyclingRequestStatus, ComplaintStatus, VolunteerEvent,
} from '../types';
import {
  DEMO_RECYCLING_REQUESTS, DEMO_COMPLAINTS,
  DEMO_NOTIFICATIONS, DEMO_VOLUNTEER_EVENTS,
} from '../lib/demo/demoData';

interface AppState {
  recyclingRequests: RecyclingRequest[];
  complaints: Complaint[];
  notifications: AppNotification[];
  volunteerEvents: VolunteerEvent[];
  unreadNotifications: number;
  language: string;
  isOffline: boolean;

  // Recycling request actions
  createRecyclingRequest: (req: Omit<RecyclingRequest, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateRequestStatus: (id: string, status: RecyclingRequestStatus, updates?: Partial<RecyclingRequest>) => void;
  acceptRequest: (requestId: string, pickerId: string, pickerName: string) => void;
  completeRequest: (requestId: string, agreedPrice: number) => void;
  cancelRequest: (id: string) => void;

  // Complaint actions
  createComplaint: (c: Omit<Complaint, 'id' | 'referenceNumber' | 'createdAt' | 'updatedAt'>) => string;
  updateComplaintStatus: (id: string, status: ComplaintStatus, resolution?: string) => void;

  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt'>) => void;

  // Events
  registerForEvent: (eventId: string) => void;
  unregisterFromEvent: (eventId: string) => void;

  // Language & connectivity
  setLanguage: (lang: string) => void;
  setOffline: (offline: boolean) => void;
}

let idCounter = 1000;
function genId() { return `local-${++idCounter}`; }
function genRef() { return `CMP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(++idCounter).padStart(4, '0')}`; }
const now = () => new Date().toISOString();

export const useAppStore = create<AppState>((set, get) => ({
  recyclingRequests: [...DEMO_RECYCLING_REQUESTS],
  complaints: [...DEMO_COMPLAINTS],
  notifications: [...DEMO_NOTIFICATIONS],
  volunteerEvents: [...DEMO_VOLUNTEER_EVENTS],
  unreadNotifications: DEMO_NOTIFICATIONS.filter(n => !n.isRead).length,
  language: 'en',
  isOffline: false,

  createRecyclingRequest: (req) => {
    const id = genId();
    const request: RecyclingRequest = {
      ...req,
      id,
      status: 'open',
      createdAt: now(),
      updatedAt: now(),
    };
    set(s => ({ recyclingRequests: [request, ...s.recyclingRequests] }));
    return id;
  },

  updateRequestStatus: (id, status, updates = {}) => {
    set(s => ({
      recyclingRequests: s.recyclingRequests.map(r =>
        r.id === id ? { ...r, ...updates, status, updatedAt: now() } : r
      ),
    }));
  },

  acceptRequest: (requestId, pickerId, pickerName) => {
    get().updateRequestStatus(requestId, 'accepted', { assignedPickerId: pickerId, assignedPickerName: pickerName });
  },

  completeRequest: (requestId, agreedPrice) => {
    get().updateRequestStatus(requestId, 'completed', { agreedPrice });
    get().addNotification({
      userId: 'current',
      title: 'Recycling Pickup Completed',
      body: `Your recycling request has been completed. Amount: ₹${agreedPrice.toFixed(2)}`,
      type: 'request_completed',
      isRead: false,
    });
  },

  cancelRequest: (id) => {
    get().updateRequestStatus(id, 'cancelled');
  },

  createComplaint: (c) => {
    const id = genId();
    const ref = genRef();
    const complaint: Complaint = {
      ...c,
      id,
      referenceNumber: ref,
      status: 'submitted',
      createdAt: now(),
      updatedAt: now(),
    };
    set(s => ({ complaints: [complaint, ...s.complaints] }));
    return ref;
  },

  updateComplaintStatus: (id, status, resolution) => {
    set(s => ({
      complaints: s.complaints.map(c =>
        c.id === id ? {
          ...c,
          status,
          resolution: resolution ?? c.resolution,
          resolvedAt: status === 'resolved' ? now() : c.resolvedAt,
          updatedAt: now(),
        } : c
      ),
    }));
  },

  addNotification: (n) => {
    const notification: AppNotification = {
      ...n,
      id: genId(),
      createdAt: now(),
    };
    set(s => ({
      notifications: [notification, ...s.notifications],
      unreadNotifications: s.unreadNotifications + 1,
    }));
  },

  markNotificationRead: (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadNotifications: Math.max(0, s.unreadNotifications - 1),
    }));
  },

  markAllRead: () => {
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, isRead: true })),
      unreadNotifications: 0,
    }));
  },

  registerForEvent: (eventId) => {
    set(s => ({
      volunteerEvents: s.volunteerEvents.map(e =>
        e.id === eventId
          ? { ...e, isRegistered: true, registeredCount: e.registeredCount + 1 }
          : e
      ),
    }));
  },

  unregisterFromEvent: (eventId) => {
    set(s => ({
      volunteerEvents: s.volunteerEvents.map(e =>
        e.id === eventId
          ? { ...e, isRegistered: false, registeredCount: Math.max(0, e.registeredCount - 1) }
          : e
      ),
    }));
  },

  setLanguage: (lang) => set({ language: lang }),
  setOffline: (offline) => set({ isOffline: offline }),
}));
