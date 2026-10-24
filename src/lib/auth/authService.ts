// Demo auth adapter — no external credentials required
import { DEMO_ACCOUNTS, DEMO_USERS } from '../demo/demoData';
import type { User, UserRole } from '../../types';

export interface AuthSession {
  user: User;
  token: string;
}

class DemoAuthService {
  private currentSession: AuthSession | null = null;

  async signIn(email: string, password: string): Promise<AuthSession> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const account = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!account) {
      throw new Error('No demo account found with this email address.');
    }
    if (password !== account.password && password !== 'demo1234') {
      throw new Error('Incorrect password. Demo password is: demo1234');
    }

    const user = DEMO_USERS[account.id];
    const session: AuthSession = {
      user,
      token: `demo-token-${account.id}-${Date.now()}`,
    };
    this.currentSession = session;
    return session;
  }

  async signInWithRole(role: UserRole): Promise<AuthSession> {
    await new Promise(r => setTimeout(r, 400));

    const account = DEMO_ACCOUNTS.find(a => a.role === role);
    if (!account) throw new Error(`No demo account for role: ${role}`);

    const user = DEMO_USERS[account.id];
    const session: AuthSession = { user, token: `demo-token-${account.id}-${Date.now()}` };
    this.currentSession = session;
    return session;
  }

  async signOut(): Promise<void> {
    await new Promise(r => setTimeout(r, 300));
    this.currentSession = null;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
  }): Promise<AuthSession> {
    await new Promise(r => setTimeout(r, 1000));
    // In demo mode, map to the matching demo account by role
    return this.signInWithRole(data.role);
  }

  getSession(): AuthSession | null {
    return this.currentSession;
  }

  isSignedIn(): boolean {
    return this.currentSession !== null;
  }
}

export const authService = new DemoAuthService();
