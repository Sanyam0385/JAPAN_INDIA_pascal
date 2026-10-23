// Core TypeScript types for CIRCULO platform

export type UserRole = 'household' | 'formal_collector' | 'informal_picker' | 'municipal_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  locality?: string;
  createdAt: string;
}

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  locality: string;
  description: string;
}

// Household
export interface Household {
  id: string;
  userId: string;
  address: string;
  locality: string;
  municipality: string;
  wasteZone: string;
  collectionDays: string[];
  totalMembers: number;
  rewardPoints: number;
}

// Collection
export type CollectionStatus = 'scheduled' | 'completed' | 'missed' | 'delayed' | 'cancelled';
export type WasteCategory = 'wet' | 'dry' | 'recyclable' | 'hazardous';

export interface CollectionSchedule {
  id: string;
  householdId: string;
  locality: string;
  date: string;
  timeSlot: string;
  category: WasteCategory;
  collectorId?: string;
  status: CollectionStatus;
  notes?: string;
}

export interface CollectionRecord {
  id: string;
  scheduleId: string;
  collectorId: string;
  householdId: string;
  completedAt: string;
  categories: { category: WasteCategory; quantityKg?: number }[];
  segregationCompliant: boolean;
  notes?: string;
  photoUrl?: string;
}

// Recycling
export type RecyclingRequestStatus =
  | 'draft' | 'open' | 'accepted' | 'en_route'
  | 'collected' | 'payment_pending' | 'completed'
  | 'cancelled' | 'disputed';

export interface RecyclingRequest {
  id: string;
  householdId: string;
  householdName: string;
  locality: string;
  materialCategory: string;
  approximateQuantityKg: number;
  unit: string;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  agreedPrice?: number;
  currency: string;
  status: RecyclingRequestStatus;
  pickupAddress: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  photoUrl?: string;
  assignedPickerId?: string;
  assignedPickerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecyclingTransaction {
  id: string;
  requestId: string;
  pickerId: string;
  householdId: string;
  materialCategory: string;
  actualQuantityKg: number;
  agreedPricePerKg: number;
  totalAmount: number;
  currency: string;
  householdConfirmed: boolean;
  pickerConfirmed: boolean;
  paymentStatus: 'pending' | 'paid' | 'disputed';
  transactionRef: string;
  completedAt: string;
  buyerId?: string;
}

// Complaints
export type ComplaintStatus =
  | 'submitted' | 'acknowledged' | 'assigned'
  | 'in_progress' | 'resolved' | 'rejected_with_reason';

export type ComplaintCategory =
  | 'missed_pickup' | 'incorrect_record' | 'collector_misconduct'
  | 'segregation_dispute' | 'overflowing_bin' | 'unclean_area'
  | 'illegal_dumping' | 'other';

export interface Complaint {
  id: string;
  referenceNumber: string;
  submittedBy: string;
  submitterName: string;
  category: ComplaintCategory;
  description: string;
  locality: string;
  address?: string;
  photoUrl?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
  assignedTo?: string;
}

// Worker
export interface WorkerProfile {
  id: string;
  userId: string;
  role: 'formal_collector' | 'informal_picker';
  name: string;
  phone: string;
  municipality: string;
  zone?: string;
  isVerified: boolean;
  badgesEarned: string[];
  totalCollectionsThisMonth: number;
  totalEarningsThisMonth?: number;
}

// Recycling Buyers
export interface RecyclingBuyer {
  id: string;
  name: string;
  isVerified: boolean;
  verificationNote: string;
  acceptedMaterials: string[];
  indicativeRates: { material: string; ratePerKg: number; currency: string }[];
  ratesLastUpdated: string;
  openingHours: string;
  phone?: string;
  address: string;
  locality: string;
  latitude?: number;
  longitude?: number;
  minimumQuantityKg?: number;
}

// Notifications
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// Events
export interface VolunteerEvent {
  id: string;
  title: string;
  description: string;
  locality: string;
  address: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  organizer: string;
  maxParticipants?: number;
  registeredCount: number;
  isRegistered?: boolean;
  latitude?: number;
  longitude?: number;
}

// Game
export interface WasteItem {
  id: string;
  name: string;
  icon: string;
  correctBin: string;
  explanation: string;
  category: string;
}

export interface GameResult {
  userId: string;
  score: number;
  totalItems: number;
  streak: number;
  completedAt: string;
  level: number;
}

// Stats
export interface HouseholdStats {
  totalCollections: number;
  missedCollections: number;
  recyclablesSoldKg: number;
  rewardPoints: number;
  segregationScore: number;
  co2SavedEstimatedKg: number;
  waterSavedEstimatedL: number;
}

export interface MunicipalStats {
  totalHouseholds: number;
  enrolledWorkers: number;
  collectionCompletionRate: number;
  missedPickups: number;
  wasteCollectedKg: number;
  recyclablesSoldKg: number;
  openComplaints: number;
  resolvedComplaints: number;
  volunteerEvents: number;
}
