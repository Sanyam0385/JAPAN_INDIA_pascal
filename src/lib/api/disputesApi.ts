// Disputes API: Transparent multi-party dispute arbitration
import { supabase, isBackendEnabled } from '../supabase/client';
import { INITIAL_DISPUTES } from '../demo/demoData';
import type { Dispute, DisputeStatus } from '../../types';

let localDisputes: Dispute[] = [...INITIAL_DISPUTES];

export const disputesApi = {
  async listDisputes(userId?: string): Promise<Dispute[]> {
    if (isBackendEnabled()) {
      try {
        let query = supabase.from('disputes').select('*').order('created_at', { ascending: false });
        if (userId) query = query.eq('raised_by_user_id', userId);

        const { data, error } = await query;
        if (error) {
          if (__DEV__) console.warn('[disputesApi.listDisputes] Supabase error:', error);
        } else if (data) {
          return data.map((d) => ({
            id: d.id,
            jobId: d.job_id,
            raisedBy: d.raised_by_role as any,
            raisedByUserId: d.raised_by_user_id,
            reason: d.reason as any,
            notes: d.notes,
            status: d.status as DisputeStatus,
            adminNote: d.admin_note || undefined,
            resolution: d.resolution || undefined,
            adjustedTotal: d.adjusted_total ? Number(d.adjusted_total) : undefined,
            createdAt: d.created_at,
            resolvedAt: d.resolved_at || undefined,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('[disputesApi.listDisputes] Network error:', e);
      }
    }

    return userId ? localDisputes.filter((d) => d.raisedByUserId === userId) : localDisputes;
  },

  async createDispute(
    disputeData: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Dispute> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('disputes')
          .insert({
            job_id: disputeData.jobId,
            raised_by_role: disputeData.raisedBy,
            raised_by_user_id: disputeData.raisedByUserId || (await supabase.auth.getUser()).data.user?.id,
            reason: disputeData.reason,
            notes: disputeData.notes,
            status: disputeData.status || 'open',
          })
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[disputesApi.createDispute] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created: Dispute = {
            id: data.id,
            jobId: data.job_id,
            raisedBy: data.raised_by_role as any,
            raisedByUserId: data.raised_by_user_id,
            reason: data.reason as any,
            notes: data.notes,
            status: data.status as DisputeStatus,
            createdAt: data.created_at,
          };
          localDisputes.unshift(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[disputesApi.createDispute] Network error:', e);
      }
    }

    const created: Dispute = {
      ...disputeData,
      id: `dispute-${Date.now().toString(36)}`,
      status: disputeData.status || 'open',
      createdAt: new Date().toISOString(),
    };
    localDisputes.unshift(created);
    return created;
  },

  async resolveDispute(
    disputeId: string,
    updates: { resolution: string; adminNote?: string; adjustedTotal?: number; status?: DisputeStatus }
  ): Promise<Dispute> {
    const status = updates.status || 'resolved';
    const resolvedAt = new Date().toISOString();

    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('disputes')
          .update({
            status,
            resolution: updates.resolution,
            admin_note: updates.adminNote || null,
            adjusted_total: updates.adjustedTotal || null,
            resolved_at: resolvedAt,
            updated_at: resolvedAt,
          })
          .eq('id', disputeId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[disputesApi.resolveDispute] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const updated: Dispute = {
            id: data.id,
            jobId: data.job_id,
            raisedBy: data.raised_by_role as any,
            raisedByUserId: data.raised_by_user_id,
            reason: data.reason as any,
            notes: data.notes,
            status: data.status as DisputeStatus,
            adminNote: data.admin_note || undefined,
            resolution: data.resolution || undefined,
            adjustedTotal: data.adjusted_total ? Number(data.adjusted_total) : undefined,
            createdAt: data.created_at,
            resolvedAt: data.resolved_at || undefined,
          };
          const idx = localDisputes.findIndex((d) => d.id === disputeId);
          if (idx !== -1) localDisputes[idx] = updated;
          return updated;
        }
      } catch (e) {
        if (__DEV__) console.warn('[disputesApi.resolveDispute] Network error:', e);
      }
    }

    const idx = localDisputes.findIndex((d) => d.id === disputeId);
    if (idx === -1) throw new Error('Dispute not found');
    const updated: Dispute = {
      ...localDisputes[idx],
      status,
      resolution: updates.resolution,
      adminNote: updates.adminNote,
      adjustedTotal: updates.adjustedTotal,
      resolvedAt,
    };
    localDisputes[idx] = updated;
    return updated;
  },
};
