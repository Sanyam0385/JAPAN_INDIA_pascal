// CIRCULO Authentication Service
// Supports Dual Mode: Live Supabase Auth with Email OTP & Standalone Demo Mode
import { supabase, isBackendEnabled } from '../supabase/client';
import { DEMO_ACCOUNTS, DEMO_USERS } from '../demo/demoData';
import type { User, UserRole, UserLocationCoords } from '../../types';
import i18n from '../../i18n';

export interface AuthSession {
  user: User;
  token: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
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
  coordinates?: UserLocationCoords;
}

export interface SignUpResult {
  session: AuthSession | null;
  needsVerification: boolean;
  email: string;
}

export interface VerifyOtpParams {
  email: string;
  token: string;
  type?: 'signup' | 'recovery' | 'email';
}

export interface ResendOtpParams {
  email: string;
  type?: 'signup' | 'recovery';
}

interface ResendTracker {
  lastSentAt: number;
  count: number;
}

const resendTrackers: Record<string, ResendTracker> = {};
const COOLDOWN_SECONDS = 60;
const MAX_RESENDS = 5;

export class AuthError extends Error {
  code?: string;
  email?: string;
  unconfirmedEmail?: boolean;

  constructor(message: string, code?: string, email?: string, unconfirmedEmail?: boolean) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.email = email;
    this.unconfirmedEmail = unconfirmedEmail;
  }
}

/**
 * Maps raw backend / Supabase errors to friendly user-facing messages
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return i18n.t('auth.errorGeneric', 'An unexpected error occurred. Please try again.');
  const msg = (typeof error === 'string' ? error : error.message || '').toLowerCase();
  const code = (error.code || error.error_code || '').toLowerCase();

  if (__DEV__) {
    console.log('[AuthService Error]', { code, msg, raw: error });
  }

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return i18n.t('auth.emailNotConfirmed', 'Email not verified yet. We have resent a 6-digit code to your email.');
  }
  if (
    msg.includes('token has expired') ||
    msg.includes('invalid') ||
    msg.includes('otp') ||
    code === 'bad_code' ||
    code === 'otp_expired'
  ) {
    return i18n.t('auth.errorInvalidOtp', 'Invalid or expired 6-digit code. Please try again.');
  }
  if (
    code === 'over_email_send_rate_limit' ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('429')
  ) {
    return i18n.t('auth.errorRateLimit', 'Too many attempts. Please wait a moment before requesting another code.');
  }
  if (
    msg.includes('user already registered') ||
    msg.includes('already exists') ||
    code === 'user_already_exists'
  ) {
    return i18n.t('auth.errorAlreadyRegistered', 'An account with this email already exists. Please log in.');
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return i18n.t('auth.loginError', 'Login failed. Please check your credentials.');
  }
  if (msg.includes('network') || msg.includes('fetch failed')) {
    return i18n.t('auth.errorNetwork', 'Network error. Please check your internet connection.');
  }

  return error.message || i18n.t('auth.errorGeneric', 'An error occurred. Please try again.');
}

class AuthService {
  private currentSession: AuthSession | null = null;
  private pendingDemoUsers: Record<string, User> = {};

  /**
   * Helper to load profile data from Supabase 'profiles' table or fallback to metadata
   */
  private async loadUserProfile(authUser: any): Promise<User> {
    const meta = authUser.user_metadata || {};
    let profileData: any = null;

    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!error && data) {
          profileData = data;
        }
      } catch {
        // Table may not yet exist in early migration stage
      }
    }

    const lat = profileData?.lat ?? meta.lat;
    const lng = profileData?.lng ?? meta.lng;

    return {
      id: authUser.id,
      email: authUser.email || '',
      name:
        profileData?.full_name ||
        meta.full_name ||
        meta.name ||
        authUser.email?.split('@')[0] ||
        'Circulo User',
      role: (profileData?.role || meta.role || 'household') as UserRole,
      phone: profileData?.phone || meta.phone,
      avatarUrl: profileData?.avatar_url || meta.avatarUrl,
      preferredLanguage: profileData?.language || meta.preferredLanguage || 'en',
      locality: profileData?.locality || meta.locality,
      subLocality: profileData?.sub_locality || meta.subLocality,
      city: profileData?.city || meta.city,
      state: profileData?.state || meta.state,
      wardName: profileData?.ward || profileData?.ward_name || meta.ward || meta.wardName,
      cityKey: profileData?.city_key || meta.city_key || meta.cityKey,
      lat,
      lng,
      accuracy: meta.accuracy,
      locationSource: meta.locationSource || 'gps',
      coordinates:
        lat && lng
          ? {
              latitude: lat,
              longitude: lng,
              accuracy: meta.accuracy,
            }
          : undefined,
      createdAt: profileData?.created_at || authUser.created_at || new Date().toISOString(),
    };
  }

  /**
   * Log In with Email and Password
   */
  async signIn(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if demo email or demo mode fallback
    const isDemoEmail = DEMO_ACCOUNTS.some(
      (a) =>
        a.email.toLowerCase() === normalizedEmail ||
        a.email.toLowerCase() === normalizedEmail.replace('@demo.circulo.app', '@circulo.app')
    );

    if (!isBackendEnabled() || isDemoEmail) {
      return this.demoSignIn(normalizedEmail, password);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const isUnconfirmed =
        error.message?.toLowerCase().includes('email not confirmed') ||
        (error as any).code === 'email_not_confirmed';

      if (isUnconfirmed) {
        // Automatically trigger OTP resend as specified in Step A1
        try {
          await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
        } catch {
          // ignore rate limits on auto-resend
        }
        throw new AuthError(
          getFriendlyAuthErrorMessage(error),
          'EMAIL_NOT_CONFIRMED',
          normalizedEmail,
          true
        );
      }
      throw new AuthError(getFriendlyAuthErrorMessage(error), (error as any).code);
    }

    if (!data.session || !data.user) {
      throw new AuthError(i18n.t('auth.loginError', 'Login failed. Please check your credentials.'));
    }

    const user = await this.loadUserProfile(data.user);
    const session: AuthSession = {
      user,
      token: data.session.access_token,
    };
    this.currentSession = session;
    return session;
  }

  /**
   * Demo mode instant sign in
   */
  private async demoSignIn(email: string, password: string): Promise<AuthSession> {
    await new Promise((r) => setTimeout(r, 400));
    const normalizedEmail = email.toLowerCase().replace('@demo.circulo.app', '@circulo.app');
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === normalizedEmail || a.email.toLowerCase() === email.toLowerCase()
    );

    if (!account) {
      throw new AuthError('No demo account found with this email.');
    }
    if (password !== account.password && password !== 'demo1234') {
      throw new AuthError('Incorrect password. Default demo password is: demo1234');
    }

    const user = DEMO_USERS[account.id];
    const session: AuthSession = {
      user,
      token: `demo-token-${account.id}-${Date.now()}`,
    };
    this.currentSession = session;
    return session;
  }

  /**
   * Instant Demo Persona Sign In (Priya, Ramesh, Meena, Kavitha, Recycler)
   * Guaranteed to work without requiring OTP (Global Rule 2)
   */
  async signInWithRole(role: UserRole): Promise<AuthSession> {
    await new Promise((r) => setTimeout(r, 300));
    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (!account) throw new AuthError(`No demo account for role: ${role}`);

    const user = DEMO_USERS[account.id];
    const session: AuthSession = { user, token: `demo-token-${account.id}-${Date.now()}` };
    this.currentSession = session;
    return session;
  }

  /**
   * Register a new user account
   * Sends 6-digit OTP code if email confirmation is enabled on Supabase
   */
  async register(data: SignUpData): Promise<SignUpResult> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const lat = data.lat ?? data.coordinates?.latitude;
    const lng = data.lng ?? data.coordinates?.longitude;

    if (!isBackendEnabled()) {
      await new Promise((r) => setTimeout(r, 500));
      const newUser: User = {
        id: `user-${Date.now().toString(36)}`,
        email: normalizedEmail,
        name: data.name.trim(),
        role: data.role,
        phone: data.phone,
        locality: data.locality || (lat && lng ? `${lat.toFixed(3)}°, ${lng.toFixed(3)}°` : ''),
        subLocality: data.subLocality,
        city: data.city,
        state: data.state,
        wardName: data.wardName,
        cityKey: data.cityKey,
        lat,
        lng,
        accuracy: data.accuracy ?? data.coordinates?.accuracy,
        locationSource: data.locationSource || 'gps',
        locationUpdatedAt: new Date().toISOString(),
        coordinates:
          data.coordinates || (lat && lng ? { latitude: lat, longitude: lng, accuracy: data.accuracy } : undefined),
        preferredLanguage: 'en',
        createdAt: new Date().toISOString(),
      };

      this.pendingDemoUsers[normalizedEmail] = newUser;
      // In demo mode, require OTP verification screen for demonstration
      return {
        session: null,
        needsVerification: true,
        email: normalizedEmail,
      };
    }

    const { data: res, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: data.password,
      options: {
        data: {
          full_name: data.name.trim(),
          role: data.role,
          locality: data.locality?.trim(),
          ward: data.wardName?.trim(),
          city_key: data.cityKey,
          lat,
          lng,
          phone: data.phone?.trim(),
        },
      },
    });

    if (error) {
      throw new AuthError(getFriendlyAuthErrorMessage(error), (error as any).code);
    }

    // Check if session was returned directly (when email confirmation is turned OFF in Supabase)
    if (res.session && res.user) {
      const user = await this.loadUserProfile(res.user);
      const session: AuthSession = {
        user,
        token: res.session.access_token,
      };
      this.currentSession = session;
      return {
        session,
        needsVerification: false,
        email: normalizedEmail,
      };
    }

    // Email confirmation is ON — user must verify OTP before session is created
    return {
      session: null,
      needsVerification: true,
      email: normalizedEmail,
    };
  }

  /**
   * Verify 6-digit OTP code for signup or recovery
   */
  async verifyOtp(params: VerifyOtpParams): Promise<AuthSession> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const token = params.token.trim();
    const type = params.type === 'recovery' ? 'recovery' : 'signup';

    if (!isBackendEnabled()) {
      await new Promise((r) => setTimeout(r, 400));
      if (token.length !== 6 || !/^\d+$/.test(token)) {
        throw new AuthError(i18n.t('auth.errorInvalidOtp', 'Invalid 6-digit code. Please try again.'));
      }

      const user = this.pendingDemoUsers[normalizedEmail] || DEMO_USERS['user-household-1'];
      const session: AuthSession = {
        user,
        token: `demo-token-${user.id}-${Date.now()}`,
      };
      this.currentSession = session;
      delete this.pendingDemoUsers[normalizedEmail];
      return session;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type,
    });

    if (error) {
      throw new AuthError(getFriendlyAuthErrorMessage(error), (error as any).code);
    }

    if (!data.session || !data.user) {
      throw new AuthError(i18n.t('auth.errorInvalidOtp', 'Invalid or expired 6-digit code. Please try again.'));
    }

    const user = await this.loadUserProfile(data.user);
    const session: AuthSession = {
      user,
      token: data.session.access_token,
    };
    this.currentSession = session;
    return session;
  }

  /**
   * Resend OTP code with client-side 60s cooldown and max 5 attempts per session
   */
  async resendOtp(params: ResendOtpParams): Promise<{ remainingSeconds: number; remainingResends: number }> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const type = params.type === 'recovery' ? 'recovery' : 'signup';

    const tracker = resendTrackers[normalizedEmail] || { lastSentAt: 0, count: 0 };
    const elapsedSec = Math.floor((Date.now() - tracker.lastSentAt) / 1000);

    if (tracker.lastSentAt > 0 && elapsedSec < COOLDOWN_SECONDS) {
      const remaining = COOLDOWN_SECONDS - elapsedSec;
      throw new AuthError(
        i18n.t('auth.resendIn', { seconds: remaining, defaultValue: `Please wait ${remaining}s before resending.` }),
        'COOLDOWN_ACTIVE'
      );
    }

    if (tracker.count >= MAX_RESENDS) {
      throw new AuthError(
        i18n.t('auth.errorMaxResends', 'Maximum resend attempts reached for this session. Please try again later.'),
        'MAX_RESENDS_REACHED'
      );
    }

    if (isBackendEnabled()) {
      if (type === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
        if (error) throw new AuthError(getFriendlyAuthErrorMessage(error), (error as any).code);
      } else {
        const { error } = await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
        if (error) throw new AuthError(getFriendlyAuthErrorMessage(error), (error as any).code);
      }
    }

    tracker.lastSentAt = Date.now();
    tracker.count += 1;
    resendTrackers[normalizedEmail] = tracker;

    return {
      remainingSeconds: COOLDOWN_SECONDS,
      remainingResends: MAX_RESENDS - tracker.count,
    };
  }

  /**
   * Get remaining cooldown seconds for an email
   */
  getCooldownRemaining(email: string): number {
    const normalizedEmail = email.trim().toLowerCase();
    const tracker = resendTrackers[normalizedEmail];
    if (!tracker || !tracker.lastSentAt) return 0;
    const elapsedSec = Math.floor((Date.now() - tracker.lastSentAt) / 1000);
    return Math.max(0, COOLDOWN_SECONDS - elapsedSec);
  }

  /**
   * Reset Password Request
   */
  async resetPasswordForEmail(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    if (isBackendEnabled()) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) throw new AuthError(getFriendlyAuthErrorMessage(error), (error as any).code);
    }

    const tracker = resendTrackers[normalizedEmail] || { lastSentAt: 0, count: 0 };
    tracker.lastSentAt = Date.now();
    tracker.count = Math.min(tracker.count + 1, MAX_RESENDS);
    resendTrackers[normalizedEmail] = tracker;
  }

  /**
   * Update Password
   */
  async updatePassword(password: string): Promise<void> {
    if (isBackendEnabled()) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new AuthError(getFriendlyAuthErrorMessage(error), (error as any).code);
    }
  }

  /**
   * Sign Out
   */
  async signOut(): Promise<void> {
    if (isBackendEnabled()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    this.currentSession = null;
  }

  /**
   * Get Current Session
   */
  async getSession(): Promise<AuthSession | null> {
    if (this.currentSession) return this.currentSession;

    if (isBackendEnabled()) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session && data.session.user) {
          const user = await this.loadUserProfile(data.session.user);
          const session: AuthSession = {
            user,
            token: data.session.access_token,
          };
          this.currentSession = session;
          return session;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  isSignedIn(): boolean {
    return this.currentSession !== null;
  }
}

export const authService = new AuthService();
