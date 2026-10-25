// Jobs API: Dual-mode pickup requests & atomic job claiming
import { supabase, isBackendEnabled } from '../supabase/client';
import { INITIAL_PICKUP_JOBS } from '../demo/demoData';
import type { PickupJob, PickupJobStatus } from '../../types';

export interface JobsFilter {
  ward?: string;
  status?: PickupJobStatus[];
  householdId?: string;
  pickerId?: string;
}

let localJobs: PickupJob[] = [...INITIAL_PICKUP_JOBS];

function mapDbRowToJob(row: any): PickupJob {
  const windowStr = row.pickup_window || 'Morning (8am - 12pm)';
  const wardStr = row.ward || 'Ward 151';
  return {
    id: row.id,
    householdId: row.household_id,
    householdName: row.household_name || undefined,
    householdAddress: row.household_address || undefined,
    pickerId: row.picker_id || undefined,
    pickerName: row.picker_name || undefined,
    material: row.material,
    estimatedKg: Number(row.estimated_kg),
    status: row.status as PickupJobStatus,
    proposedRatePerKg: row.proposed_rate_per_kg ? Number(row.proposed_rate_per_kg) : undefined,
    lockedRatePerKg: row.locked_rate_per_kg ? Number(row.locked_rate_per_kg) : undefined,
    measuredKg: row.measured_kg ? Number(row.measured_kg) : undefined,
    window: windowStr,
    pickupWindow: windowStr,
    location: {
      ward: wardStr,
      address: row.household_address || undefined,
      latitude: row.lat ?? undefined,
      longitude: row.lng ?? undefined,
    },
    ward: wardStr,
    cityKey: row.city_key || 'BLR',
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    notes: row.notes || undefined,
    destinationId: row.destination_id || undefined,
    destinationName: row.destination_name || undefined,
    receiptId: row.receipt_id || undefined,
    disputeId: row.dispute_id || undefined,
    qrCode: row.qr_code || undefined,
    hasContamination: row.has_contamination || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const jobsApi = {
  /**
   * List pickup jobs with optional filtering by ward, status, or participants
   */
  async listJobs(filter?: JobsFilter): Promise<PickupJob[]> {
    if (isBackendEnabled()) {
      try {
        let query = supabase.from('pickup_jobs').select('*').order('created_at', { ascending: false });

        if (filter?.ward) query = query.eq('ward', filter.ward);
        if (filter?.householdId) query = query.eq('household_id', filter.householdId);
        if (filter?.pickerId) query = query.eq('picker_id', filter.pickerId);
        if (filter?.status && filter.status.length > 0) {
          query = query.in('status', filter.status);
        }

        const { data, error } = await query;
        if (error) {
          if (__DEV__) console.warn('[jobsApi.listJobs] Supabase error:', error);
        } else if (data) {
          return data.map(mapDbRowToJob);
        }
      } catch (e) {
        if (__DEV__) console.warn('[jobsApi.listJobs] Network error:', e);
      }
    }

    // Local Demo Filter
    return localJobs.filter((j) => {
      const jobWard = j.ward || j.location?.ward;
      if (filter?.ward && jobWard !== filter.ward) return false;
      if (filter?.householdId && j.householdId !== filter.householdId) return false;
      if (filter?.pickerId && j.pickerId !== filter.pickerId) return false;
      if (filter?.status && filter.status.length > 0 && !filter.status.includes(j.status)) return false;
      return true;
    });
  },

  /**
   * Get single job by ID
   */
  async getJob(jobId: string): Promise<PickupJob | null> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('pickup_jobs')
          .select('*')
          .eq('id', jobId)
          .maybeSingle();

        if (error) {
          if (__DEV__) console.warn('[jobsApi.getJob] Supabase error:', error);
        } else if (data) {
          return mapDbRowToJob(data);
        }
      } catch (e) {
        if (__DEV__) console.warn('[jobsApi.getJob] Network error:', e);
      }
    }

    return localJobs.find((j) => j.id === jobId) || null;
  },

  /**
   * Create a new pickup job (dual-mode)
   */
  async createJob(jobData: Omit<PickupJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<PickupJob> {
    const pickupWindow = jobData.pickupWindow || jobData.window || 'Morning (8am - 12pm)';
    const ward = jobData.ward || jobData.location?.ward || 'Ward 151';
    const cityKey = jobData.cityKey || 'BLR';
    const lat = jobData.lat ?? jobData.location?.latitude ?? null;
    const lng = jobData.lng ?? jobData.location?.longitude ?? null;

    if (isBackendEnabled()) {
      try {
        const insertPayload = {
          household_id: jobData.householdId,
          household_name: jobData.householdName,
          household_address: jobData.householdAddress,
          picker_id: jobData.pickerId || null,
          picker_name: jobData.pickerName || null,
          material: jobData.material,
          estimated_kg: jobData.estimatedKg,
          status: jobData.status || 'listed',
          proposed_rate_per_kg: jobData.proposedRatePerKg || null,
          locked_rate_per_kg: jobData.lockedRatePerKg || null,
          pickup_window: pickupWindow,
          ward: ward,
          city_key: cityKey,
          lat: lat,
          lng: lng,
          notes: jobData.notes || null,
          qr_code: jobData.qrCode || `QR-${Date.now().toString(36).toUpperCase()}`,
          pin: (Math.floor(1000 + Math.random() * 9000)).toString(),
          has_contamination: jobData.hasContamination || false,
        };

        const { data, error } = await supabase
          .from('pickup_jobs')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[jobsApi.createJob] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created = mapDbRowToJob(data);
          localJobs.unshift(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[jobsApi.createJob] Network error, falling back to local:', e);
      }
    }

    // Local Demo Implementation
    const localCreated: PickupJob = {
      ...jobData,
      id: `job-local-${Date.now().toString(36)}`,
      window: pickupWindow,
      pickupWindow: pickupWindow,
      location: jobData.location || {
        ward: ward,
        address: jobData.householdAddress,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
      },
      ward: ward,
      cityKey: cityKey,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      notes: jobData.notes,
      qrCode: jobData.qrCode || `QR-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localJobs.unshift(localCreated);
    return localCreated;
  },

  /**
   * Atomically claim a job using the security-definer claim_job SQL function
   * Prevents race conditions so two pickers can never claim the same job.
   */
  async claimJob(jobId: string, pickerName?: string): Promise<boolean> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase.rpc('claim_job', {
          p_job_id: jobId,
        });

        if (error) {
          if (__DEV__) console.warn('[jobsApi.claimJob] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data === true) {
          // Optimistically update local cache
          const target = localJobs.find((j) => j.id === jobId);
          if (target) {
            target.status = 'claimed';
            target.pickerName = pickerName || 'Assigned Picker';
            target.updatedAt = new Date().toISOString();
          }
          return true;
        }
        return false;
      } catch (e) {
        if (__DEV__) console.warn('[jobsApi.claimJob] Network/claim error:', e);
        throw e;
      }
    }

    // Local Demo Claiming
    const target = localJobs.find((j) => j.id === jobId);
    if (!target) return false;
    if (target.status !== 'listed' && target.status !== 'rate_locked' && target.status !== 'rate_proposed') {
      return false;
    }
    if (target.pickerId) return false;

    target.status = 'claimed';
    target.pickerId = 'demo-picker-1';
    target.pickerName = pickerName || 'Meena Devi';
    target.updatedAt = new Date().toISOString();
    return true;
  },

  /**
   * Update job status (with optional measured_kg or rate updates)
   */
  async updateJobStatus(
    jobId: string,
    status: PickupJobStatus,
    updates?: Partial<PickupJob>
  ): Promise<PickupJob> {
    if (isBackendEnabled()) {
      try {
        const dbUpdates: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (updates?.measuredKg !== undefined) dbUpdates.measured_kg = updates.measuredKg;
        if (updates?.lockedRatePerKg !== undefined) dbUpdates.locked_rate_per_kg = updates.lockedRatePerKg;
        if (updates?.proposedRatePerKg !== undefined) dbUpdates.proposed_rate_per_kg = updates.proposedRatePerKg;
        if (updates?.pickerId !== undefined) dbUpdates.picker_id = updates.pickerId;
        if (updates?.pickerName !== undefined) dbUpdates.picker_name = updates.pickerName;
        if (updates?.destinationId !== undefined) dbUpdates.destination_id = updates.destinationId;
        if (updates?.destinationName !== undefined) dbUpdates.destination_name = updates.destinationName;
        if (updates?.receiptId !== undefined) dbUpdates.receipt_id = updates.receiptId;
        if (updates?.hasContamination !== undefined) dbUpdates.has_contamination = updates.hasContamination;

        const { data, error } = await supabase
          .from('pickup_jobs')
          .update(dbUpdates)
          .eq('id', jobId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[jobsApi.updateJobStatus] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const updated = mapDbRowToJob(data);
          const idx = localJobs.findIndex((j) => j.id === jobId);
          if (idx !== -1) localJobs[idx] = updated;
          return updated;
        }
      } catch (e) {
        if (__DEV__) console.warn('[jobsApi.updateJobStatus] Network error:', e);
      }
    }

    // Local Demo Update
    const idx = localJobs.findIndex((j) => j.id === jobId);
    if (idx === -1) throw new Error('Job not found');
    const updated: PickupJob = {
      ...localJobs[idx],
      ...updates,
      status,
      updatedAt: new Date().toISOString(),
    };
    localJobs[idx] = updated;
    return updated;
  },

  /**
   * Reset in-memory cache to demo defaults
   */
  resetLocalCache() {
    localJobs = [...INITIAL_PICKUP_JOBS];
  },
};
