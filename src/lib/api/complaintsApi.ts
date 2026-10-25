// Complaints API: Citizen Grievance Redressal
import { supabase, isBackendEnabled } from '../supabase/client';
import { DEMO_COMPLAINTS } from '../demo/demoData';
import type { Complaint, ComplaintStatus } from '../../types';

let localComplaints: Complaint[] = [...DEMO_COMPLAINTS];

export const complaintsApi = {
  async listComplaints(userId?: string): Promise<Complaint[]> {
    if (isBackendEnabled()) {
      try {
        let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) {
          if (__DEV__) console.warn('[complaintsApi.listComplaints] Supabase error:', error);
        } else if (data) {
          return data.map((c) => ({
            id: c.id,
            referenceNumber: c.reference_number,
            userId: c.user_id,
            category: c.category as any,
            description: c.description,
            locality: c.locality,
            ward: c.ward || undefined,
            status: c.status as ComplaintStatus,
            resolution: c.resolution || undefined,
            createdAt: c.created_at,
            resolvedAt: c.resolved_at || undefined,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('[complaintsApi.listComplaints] Network error:', e);
      }
    }

    return userId ? localComplaints.filter((c) => c.userId === userId) : localComplaints;
  },

  async createComplaint(
    complaintData: Omit<Complaint, 'id' | 'referenceNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Complaint> {
    const referenceNumber = `CMP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .insert({
            reference_number: referenceNumber,
            user_id: complaintData.userId,
            category: complaintData.category,
            description: complaintData.description,
            locality: complaintData.locality,
            ward: complaintData.ward || null,
            status: complaintData.status || 'submitted',
          })
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[complaintsApi.createComplaint] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created: Complaint = {
            id: data.id,
            referenceNumber: data.reference_number,
            userId: data.user_id,
            category: data.category as any,
            description: data.description,
            locality: data.locality,
            ward: data.ward || undefined,
            status: data.status as ComplaintStatus,
            createdAt: data.created_at,
          };
          localComplaints.unshift(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[complaintsApi.createComplaint] Network error:', e);
      }
    }

    const created: Complaint = {
      ...complaintData,
      id: `complaint-${Date.now().toString(36)}`,
      referenceNumber,
      status: complaintData.status || 'submitted',
      createdAt: new Date().toISOString(),
    };
    localComplaints.unshift(created);
    return created;
  },

  async updateComplaintStatus(
    complaintId: string,
    status: ComplaintStatus,
    resolution?: string
  ): Promise<Complaint> {
    const resolvedAt = status === 'resolved' ? new Date().toISOString() : undefined;

    if (isBackendEnabled()) {
      try {
        const dbUpdates: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (resolution) dbUpdates.resolution = resolution;
        if (resolvedAt) dbUpdates.resolved_at = resolvedAt;

        const { data, error } = await supabase
          .from('complaints')
          .update(dbUpdates)
          .eq('id', complaintId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[complaintsApi.updateComplaintStatus] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const updated: Complaint = {
            id: data.id,
            referenceNumber: data.reference_number,
            userId: data.user_id,
            category: data.category as any,
            description: data.description,
            locality: data.locality,
            ward: data.ward || undefined,
            status: data.status as ComplaintStatus,
            resolution: data.resolution || undefined,
            createdAt: data.created_at,
            resolvedAt: data.resolved_at || undefined,
          };
          const idx = localComplaints.findIndex((c) => c.id === complaintId);
          if (idx !== -1) localComplaints[idx] = updated;
          return updated;
        }
      } catch (e) {
        if (__DEV__) console.warn('[complaintsApi.updateComplaintStatus] Network error:', e);
      }
    }

    const idx = localComplaints.findIndex((c) => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');
    const updated: Complaint = {
      ...localComplaints[idx],
      status,
      resolution: resolution || localComplaints[idx].resolution,
      resolvedAt: resolvedAt || localComplaints[idx].resolvedAt,
    };
    localComplaints[idx] = updated;
    return updated;
  },
};
