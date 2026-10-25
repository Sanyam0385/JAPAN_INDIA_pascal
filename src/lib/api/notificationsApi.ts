// Notifications API: In-app toasts, job updates & alerts
import { supabase, isBackendEnabled } from '../supabase/client';
import { DEMO_NOTIFICATIONS } from '../demo/demoData';
import type { AppNotification } from '../../types';

let localNotifications: AppNotification[] = [...DEMO_NOTIFICATIONS];

export const notificationsApi = {
  async listNotifications(userId: string): Promise<AppNotification[]> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          if (__DEV__) console.warn('[notificationsApi.listNotifications] Supabase error:', error);
        } else if (data) {
          return data.map((n) => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            body: n.message || n.title,
            message: n.message,
            type: n.type as any,
            isRead: Boolean(n.read),
            read: Boolean(n.read),
            jobId: n.job_id || undefined,
            createdAt: n.created_at,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('[notificationsApi.listNotifications] Network error:', e);
      }
    }

    return localNotifications.filter((n) => n.userId === userId || !n.userId);
  },

  async markAsRead(notificationId: string): Promise<void> {
    if (isBackendEnabled()) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      } catch (e) {
        if (__DEV__) console.warn('[notificationsApi.markAsRead] Network error:', e);
      }
    }

    const target = localNotifications.find((n) => n.id === notificationId);
    if (target) {
      target.read = true;
      target.isRead = true;
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (isBackendEnabled()) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId);
      } catch (e) {
        if (__DEV__) console.warn('[notificationsApi.markAllAsRead] Network error:', e);
      }
    }

    localNotifications.forEach((n) => {
      if (n.userId === userId || !n.userId) {
        n.read = true;
        n.isRead = true;
      }
    });
  },

  async createNotification(
    nData: Omit<AppNotification, 'id' | 'createdAt'>
  ): Promise<AppNotification> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: nData.userId,
            title: nData.title,
            message: nData.message || nData.body,
            type: nData.type || 'info',
            job_id: nData.jobId || null,
            read: false,
          })
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[notificationsApi.createNotification] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created: AppNotification = {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            body: data.message || data.title,
            message: data.message,
            type: data.type as any,
            isRead: Boolean(data.read),
            read: Boolean(data.read),
            jobId: data.job_id || undefined,
            createdAt: data.created_at,
          };
          localNotifications.unshift(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[notificationsApi.createNotification] Network error:', e);
      }
    }

    const created: AppNotification = {
      ...nData,
      id: `notif-${Date.now().toString(36)}`,
      body: nData.body || nData.message || '',
      isRead: false,
      read: false,
      createdAt: new Date().toISOString(),
    };
    localNotifications.unshift(created);
    return created;
  },
};
