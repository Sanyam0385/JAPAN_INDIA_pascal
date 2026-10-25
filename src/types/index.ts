// Core TypeScript types for CIRCULO platform

export type UserRole = 'household' | 'formal_collector' | 'informal_picker' | 'municipal_admin' | 'recycler';

export interface UserLocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number | null;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  locality?: string;
  subLocality?: string;
  city?: string;
  state?: string;
  wardName?: string;
  cityKey?: string;
  lat?: number;
  lng?: number;
  accuracy?: number | null;
  locationSource?: 'gps' | 'manual' | 'demo';
  locationUpdatedAt?: string;
  coordinates?: UserLocationCoords;
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
  memberCount?: number;
  ward?: string;
  isSegregating?: boolean;
  rewardPoints: number;
  segregationScore?: number;
  createdAt?: string;
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

export type RouteStopStatus = 'pending' | 'current' | 'completed' | 'skipped';

export interface RouteStopData {
  id: string;
  routeId?: string;
  sequence: number;
  householdId?: string;
  houseNumber: string;
  address: string;
  locality: string;
  ward?: string;
  latitude: number;
  longitude: number;
  wasteType: 'wet' | 'dry' | 'recyclable' | 'hazardous';
  timeSlot: string;
  status: RouteStopStatus;
  collectedKg?: number;
  segregationRating?: number;
  completedAt?: string;
  notes?: string;
}

export interface CollectorRoute {
  id: string;
  collectorId?: string;
  collectorName: string;
  vehicleNumber?: string;
  shiftDate: string;
  ward: string;
  cityKey: string;
  truckCapacityKg: number;
  currentLoadKg: number;
  status: 'active' | 'completed' | 'paused';
  totalStops: number;
  completedStops: number;
  stops: RouteStopData[];
}

// Recycling
export type MaterialCategory = string;

export type RecyclingRequestStatus =
  | 'draft' | 'open' | 'accepted' | 'en_route'
  | 'collected' | 'payment_pending' | 'completed'
  | 'cancelled' | 'disputed';

export interface RecyclingRequest {
  id: string;
  householdId: string;
  householdName?: string;
  locality?: string;
  materialCategory: string;
  approximateQuantityKg: number;
  unit?: string;
  quantityUnit?: string;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  agreedPrice?: number;
  currency?: string;
  status: RecyclingRequestStatus;
  pickupAddress: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  preferredPickupWindow?: string;
  notes?: string;
  photoUrl?: string;
  assignedPickerId?: string;
  assignedPickerName?: string;
  isDemoData?: boolean;
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
  submittedBy?: string;
  submitterName?: string;
  householdId?: string;
  userId?: string;
  category: string;
  description: string;
  locality: string;
  ward?: string;
  cityKey?: string;
  address?: string;
  photoUrl?: string;
  status: ComplaintStatus;
  isDemoData?: boolean;
  createdAt: string;
  updatedAt?: string;
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
  verificationNote?: string;
  acceptedMaterials: string[];
  indicativeRates?: { material: string; ratePerKg: number; currency: string }[];
  priceListPerKg?: Record<string, number>;
  ratesLastUpdated?: string;
  openingHours?: string;
  operatingHours?: string;
  phone?: string;
  rating?: number;
  contactPerson?: string;
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
  message?: string;
  type: string;
  isRead: boolean;
  read?: boolean;
  jobId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// Events
export interface VolunteerEvent {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  description: string;
  locality: string;
  address?: string;
  meetingPoint?: string;
  eventDate?: string;
  date?: string;
  startTime: string;
  endTime?: string;
  organizer?: string;
  organiser?: string;
  maxParticipants?: number;
  registeredCount: number;
  isRegistered?: boolean;
  rewardPoints?: number;
  latitude?: number;
  longitude?: number;
}

// Game
export interface WasteItem {
  id: string;
  name: string;
  icon: string;
  emoji?: string;
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

// ============================================================================
// SHARED RECORD LAYER (CIRCULO Unified Handoff Architecture)
// Chain: Household -> Picker -> Recycler / MRF -> Municipal Ledger
// ============================================================================

export type PickupJobStatus =
  | 'listed'
  | 'rate_proposed'
  | 'rate_locked'
  | 'claimed'
  | 'en_route'
  | 'collected'
  | 'weighed'
  | 'handed_to_recycler'
  | 'completed'
  | 'disputed';

export interface PickupJobLocation {
  ward: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface PickupJob {
  id: string;
  householdId: string;
  householdName?: string;
  householdAddress?: string;
  pickerId?: string;
  pickerName?: string;
  assignedPickerName?: string;
  material: string;
  estimatedKg: number;
  status: PickupJobStatus;
  proposedRatePerKg?: number;
  lockedRatePerKg?: number;
  measuredKg?: number;
  createdAt: string;
  updatedAt?: string;
  window: string;
  pickupWindow?: string;
  location: PickupJobLocation;
  ward?: string;
  cityKey?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  pin?: string;
  activeOffer?: RateOffer;
  destinationId?: string;
  destinationName?: string;
  receiptId?: string;
  disputeId?: string;
  qrCode?: string;
  hasContamination?: boolean;
}

export type RateOfferStatus = 'pending' | 'accepted' | 'countered' | 'rejected';

export interface RateOffer {
  id: string;
  jobId: string;
  proposedBy: 'household' | 'picker';
  ratePerKg: number;
  status: RateOfferStatus;
  counterOffer?: {
    proposedBy: 'household' | 'picker';
    ratePerKg: number;
    createdAt?: string;
    note?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface ReceiptLineItem {
  label: string;
  amount: number;
  ratePerKg?: number;
  isDeduction?: boolean;
  reason?: string;
}

export type ReceiptPaymentStatus = 'pending' | 'cleared_upi_simulated';

export interface Receipt {
  id: string;
  jobId: string;
  receiptNumber: string;
  material: string;
  measuredKg: number;
  ratePerKg: number;
  lineItems: ReceiptLineItem[];
  total: number;
  paymentStatus: ReceiptPaymentStatus;
  destinationId?: string;
  destinationName?: string;
  issuedAt: string;
  householdId?: string;
  householdName?: string;
  pickerId?: string;
  pickerName?: string;
  collectorName?: string;
  recyclerId?: string;
  recyclerName?: string;
  ledgerHash?: string;
  disputeId?: string;
  disputeStatus?: DisputeStatus;
}

export interface Recycler {
  id: string;
  name: string;
  address: string;
  locality?: string;
  acceptedMaterials: string[];
  hours: string;
  phone?: string;
  rating?: number;
  isVerified?: boolean;
  priceListPerKg?: Record<string, number>;
  latitude?: number;
  longitude?: number;
}

export type QualityGrade = 'clean' | 'mixed' | 'contaminated';
export type RecyclerIntakeStatus = 'received' | 'graded' | 'settled' | 'rejected';

export interface RecyclerIntake {
  id: string;
  jobId: string;
  recyclerId: string;
  recyclerName?: string;
  declaredKg: number;
  confirmedKg: number;
  qualityGrade: QualityGrade;
  contaminationNote?: string;
  deductionAmount?: number;
  settlementAmount?: number;
  status: RecyclerIntakeStatus;
  createdAt?: string;
  settledAt?: string;
}

export type DisputeRaisedBy = 'household' | 'picker' | 'recycler';
export type DisputeReason =
  | 'weight'
  | 'price'
  | 'payment'
  | 'other'
  | 'weight_mismatch'
  | 'rate_changed'
  | 'contamination_unfair'
  | 'payment_not_received';
export type DisputeStatus = 'open' | 'under_review' | 'resolved';

export interface Dispute {
  id: string;
  jobId: string;
  receiptId?: string;
  receiptNumber?: string;
  raisedBy: DisputeRaisedBy;
  raisedByUserId?: string;
  raisedByName?: string;
  partyAccused?: string;
  material?: string;
  disputedAmount?: number;
  claimedWeight?: number;
  measuredWeight?: number;
  claimedRate?: number;
  appliedRate?: number;
  reason: DisputeReason;
  notes: string;
  photoEvidenceUri?: string;
  status: DisputeStatus;
  adminNote?: string;
  resolution?: string;
  resolutionAction?: 'uphold' | 'adjust' | 'split';
  adjustedTotal?: number;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export type IssueType = 'missed_pickup' | 'contamination' | 'overflow' | 'other';
export type IssueStatus = 'open' | 'investigating' | 'resolved';

export interface Issue {
  id: string;
  raisedByRole: UserRole | string;
  raisedByUserId?: string;
  raisedByName?: string;
  locality?: string;
  ward?: string;
  type: IssueType;
  note: string;
  status: IssueStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface CityBinConfig {
  key: string;
  label: string;
  localLabel?: string;
  colorHex?: string;
  color?: string;
  colorName?: string;
  accepts?: string[];
  acceptedItems?: string[];
  rules?: string[];
}

export interface WatchLearnVideo {
  id: string;
  title: string;
  duration: string;
  category: string;
  views: string;
  thumbnailEmoji: string;
  color: string;
  takeaways: string[];
  youtubeId?: string;
}

export interface CityScheduleDay {
  day: string;
  category: string;
  timeSlot: string;
  notes?: string;
}

export interface CityConfigSchedule {
  wet: string;
  dry: string;
  sanitary?: string;
  hazardous?: string;
  [key: string]: any;
}

export interface CityConfig {
  cityName: string;
  name: string;
  wardName: string;
  cityCode?: string;
  municipalName?: string;
  state?: string;
  isGeneric?: boolean;
  notice?: string;
  centerCoords?: { lat: number; lng: number };
  bins: CityBinConfig[] & {
    wet: CityBinConfig;
    dry: CityBinConfig;
    sanitary?: CityBinConfig;
    hazardous?: CityBinConfig;
    [key: string]: any;
  };
  collectionSchedule: CityScheduleDay[];
  schedule: CityConfigSchedule;
}
