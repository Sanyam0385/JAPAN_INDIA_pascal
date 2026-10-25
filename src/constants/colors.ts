// CIRCULO Design System — Color Tokens
// Primary brand: Deep Forest Green

export const Colors = {
  // Primary
  primary: '#1B5E20',
  primaryDark: '#0D3311',
  primaryLight: '#2E7D32',
  primaryMid: '#388E3C',

  // Accents
  emerald: '#43A047',
  mint: '#A5D6A7',
  mintLight: '#C8E6C9',
  mintPale: '#E8F5E9',

  // Background / Surface
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F7F4',
  card: '#FFFFFF',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',

  // Border
  border: '#E8EDE8',
  borderStrong: '#B5C4B5',
  divider: '#EEEEEE',

  // Status
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F57F17',
  warningLight: '#FFF8E1',
  error: '#C62828',
  errorLight: '#FFEBEE',
  info: '#0277BD',
  infoLight: '#E1F5FE',

  // Neutrals
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Role-specific accent colors
  householdAccent: '#1B5E20',
  collectorAccent: '#01579B',
  pickerAccent: '#E65100',
  adminAccent: '#4A148C',

  // Transparent
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
