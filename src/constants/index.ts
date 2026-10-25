export * from './colors';
export * from './typography';
export * from './spacing';

export const APP_NAME = 'CIRCULO';
export const APP_VERSION = '1.0.0';

export const DEMO_MODE = true; // Set to false in production

export const ROLES = {
  HOUSEHOLD: 'household',
  FORMAL_COLLECTOR: 'formal_collector',
  INFORMAL_PICKER: 'informal_picker',
  MUNICIPAL_ADMIN: 'municipal_admin',
  RECYCLER: 'recycler',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  household: 'Household / Citizen',
  formal_collector: 'Municipal Waste Collector',
  informal_picker: 'Waste Picker / Recycler',
  municipal_admin: 'Municipal Administrator',
  recycler: 'Recycler / MRF Facility',
};

export const ROLE_ICONS: Record<string, string> = {
  household: 'home',
  formal_collector: 'truck',
  informal_picker: 'recycle',
  municipal_admin: 'shield-checkmark',
  recycler: 'business',
};

export const RECYCLING_REQUEST_STATUSES = [
  'draft',
  'open',
  'accepted',
  'en_route',
  'collected',
  'payment_pending',
  'completed',
  'cancelled',
  'disputed',
] as const;

export type RecyclingRequestStatus = typeof RECYCLING_REQUEST_STATUSES[number];

export const COMPLAINT_STATUSES = [
  'submitted',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'rejected_with_reason',
] as const;

export type ComplaintStatus = typeof COMPLAINT_STATUSES[number];

export const MATERIAL_CATEGORIES = [
  { id: 'paper', label: 'Paper & Cardboard', icon: '📄', color: '#795548' },
  { id: 'plastic', label: 'Plastic', icon: '🧴', color: '#1976D2' },
  { id: 'metal', label: 'Metal', icon: '🔩', color: '#607D8B' },
  { id: 'glass', label: 'Glass', icon: '🫙', color: '#00897B' },
  { id: 'electronics', label: 'Electronics', icon: '📱', color: '#7B1FA2' },
  { id: 'organic', label: 'Organic / Wet', icon: '🌿', color: '#388E3C' },
  { id: 'hazardous', label: 'Hazardous', icon: '⚠️', color: '#D32F2F' },
  { id: 'other', label: 'Other', icon: '♻️', color: '#F57C00' },
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
] as const;
