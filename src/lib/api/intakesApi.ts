// Intakes API: MRF Weigh-in, Contamination Purity Grading & Settlements
import { supabase, isBackendEnabled } from '../supabase/client';
import { INITIAL_RECYCLER_INTAKES } from '../demo/demoData';
import type { RecyclerIntake } from '../../types';

let localIntakes: RecyclerIntake[] = [...INITIAL_RECYCLER_INTAKES];

export const intakesApi = {
  async listIntakes(recyclerId?: string): Promise<RecyclerIntake[]> {
    if (isBackendEnabled()) {
      try {
        let query = supabase.from('recycler_intakes').select('*').order('created_at', { ascending: false });
        if (recyclerId) query = query.eq('recycler_id', recyclerId);

        const { data, error } = await query;
        if (error) {
          if (__DEV__) console.warn('[intakesApi.listIntakes] Supabase error:', error);
        } else if (data) {
          return data.map((i) => ({
            id: i.id,
            jobId: i.job_id,
            recyclerId: i.recycler_id,
            recyclerName: i.recycler_name || undefined,
            declaredKg: Number(i.declared_kg),
            confirmedKg: Number(i.confirmed_kg),
            qualityGrade: i.quality_grade as any,
            contaminationNote: i.contamination_note || undefined,
            deductionAmount: Number(i.deduction_amount || 0),
            settlementAmount: Number(i.settlement_amount || 0),
            status: i.status as any,
            createdAt: i.created_at,
            settledAt: i.settled_at || undefined,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('[intakesApi.listIntakes] Network error:', e);
      }
    }

    return recyclerId ? localIntakes.filter((i) => i.recyclerId === recyclerId) : localIntakes;
  },

  async createIntake(
    intakeData: Omit<RecyclerIntake, 'id' | 'createdAt'>
  ): Promise<RecyclerIntake> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('recycler_intakes')
          .insert({
            job_id: intakeData.jobId,
            recycler_id: intakeData.recyclerId,
            recycler_name: intakeData.recyclerName || null,
            declared_kg: intakeData.declaredKg,
            confirmed_kg: intakeData.confirmedKg,
            quality_grade: intakeData.qualityGrade,
            contamination_note: intakeData.contaminationNote || null,
            deduction_amount: intakeData.deductionAmount || 0,
            settlement_amount: intakeData.settlementAmount || 0,
            status: intakeData.status || 'graded',
            settled_at: intakeData.settledAt || null,
          })
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[intakesApi.createIntake] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created: RecyclerIntake = {
            id: data.id,
            jobId: data.job_id,
            recyclerId: data.recycler_id,
            recyclerName: data.recycler_name || undefined,
            declaredKg: Number(data.declared_kg),
            confirmedKg: Number(data.confirmed_kg),
            qualityGrade: data.quality_grade as any,
            contaminationNote: data.contamination_note || undefined,
            deductionAmount: Number(data.deduction_amount || 0),
            settlementAmount: Number(data.settlement_amount || 0),
            status: data.status as any,
            createdAt: data.created_at,
            settledAt: data.settled_at || undefined,
          };
          localIntakes.unshift(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[intakesApi.createIntake] Network error:', e);
      }
    }

    const created: RecyclerIntake = {
      ...intakeData,
      id: `intake-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    localIntakes.unshift(created);
    return created;
  },

  async updateIntake(intakeId: string, updates: Partial<RecyclerIntake>): Promise<RecyclerIntake> {
    if (isBackendEnabled()) {
      try {
        const dbUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.confirmedKg !== undefined) dbUpdates.confirmed_kg = updates.confirmedKg;
        if (updates.qualityGrade !== undefined) dbUpdates.quality_grade = updates.qualityGrade;
        if (updates.contaminationNote !== undefined) dbUpdates.contamination_note = updates.contaminationNote;
        if (updates.deductionAmount !== undefined) dbUpdates.deduction_amount = updates.deductionAmount;
        if (updates.settlementAmount !== undefined) dbUpdates.settlement_amount = updates.settlementAmount;
        if (updates.settledAt !== undefined) dbUpdates.settled_at = updates.settledAt;

        const { data, error } = await supabase
          .from('recycler_intakes')
          .update(dbUpdates)
          .eq('id', intakeId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[intakesApi.updateIntake] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const updated: RecyclerIntake = {
            id: data.id,
            jobId: data.job_id,
            recyclerId: data.recycler_id,
            recyclerName: data.recycler_name || undefined,
            declaredKg: Number(data.declared_kg),
            confirmedKg: Number(data.confirmed_kg),
            qualityGrade: data.quality_grade as any,
            contaminationNote: data.contamination_note || undefined,
            deductionAmount: Number(data.deduction_amount || 0),
            settlementAmount: Number(data.settlement_amount || 0),
            status: data.status as any,
            createdAt: data.created_at,
            settledAt: data.settled_at || undefined,
          };
          const idx = localIntakes.findIndex((i) => i.id === intakeId);
          if (idx !== -1) localIntakes[idx] = updated;
          return updated;
        }
      } catch (e) {
        if (__DEV__) console.warn('[intakesApi.updateIntake] Network error:', e);
      }
    }

    const idx = localIntakes.findIndex((i) => i.id === intakeId);
    if (idx === -1) throw new Error('Intake not found');
    const updated: RecyclerIntake = { ...localIntakes[idx], ...updates };
    localIntakes[idx] = updated;
    return updated;
  },
};
