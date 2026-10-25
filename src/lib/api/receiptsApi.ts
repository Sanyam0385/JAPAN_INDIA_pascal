// Receipts API: Fair value digital receipts & immutable transaction log
import { supabase, isBackendEnabled } from '../supabase/client';
import { INITIAL_RECEIPTS } from '../demo/demoData';
import type { Receipt, ReceiptPaymentStatus } from '../../types';

let localReceipts: Receipt[] = [...INITIAL_RECEIPTS];

export const receiptsApi = {
  async listReceipts(filter?: { householdId?: string; pickerId?: string; recyclerId?: string }): Promise<Receipt[]> {
    if (isBackendEnabled()) {
      try {
        let query = supabase.from('receipts').select('*').order('issued_at', { ascending: false });
        if (filter?.householdId) query = query.eq('household_id', filter.householdId);
        if (filter?.pickerId) query = query.eq('picker_id', filter.pickerId);
        if (filter?.recyclerId) query = query.eq('recycler_id', filter.recyclerId);

        const { data, error } = await query;
        if (error) {
          if (__DEV__) console.warn('[receiptsApi.listReceipts] Supabase error:', error);
        } else if (data) {
          return data.map((r) => ({
            id: r.id,
            jobId: r.job_id || undefined,
            receiptNumber: r.receipt_number,
            material: r.material,
            measuredKg: Number(r.measured_kg),
            ratePerKg: Number(r.rate_per_kg),
            lineItems: (r.line_items as any) || [],
            total: Number(r.total),
            paymentStatus: r.payment_status as ReceiptPaymentStatus,
            householdId: r.household_id || undefined,
            pickerId: r.picker_id || undefined,
            recyclerId: r.recycler_id || undefined,
            issuedAt: r.issued_at,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('[receiptsApi.listReceipts] Network error:', e);
      }
    }

    return localReceipts.filter((r) => {
      if (filter?.householdId && r.householdId !== filter.householdId) return false;
      if (filter?.pickerId && r.pickerId !== filter.pickerId) return false;
      if (filter?.recyclerId && r.recyclerId !== filter.recyclerId) return false;
      return true;
    });
  },

  async getReceipt(receiptId: string): Promise<Receipt | null> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', receiptId)
          .maybeSingle();

        if (error) {
          if (__DEV__) console.warn('[receiptsApi.getReceipt] Supabase error:', error);
        } else if (data) {
          return {
            id: data.id,
            jobId: data.job_id || undefined,
            receiptNumber: data.receipt_number,
            material: data.material,
            measuredKg: Number(data.measured_kg),
            ratePerKg: Number(data.rate_per_kg),
            lineItems: (data.line_items as any) || [],
            total: Number(data.total),
            paymentStatus: data.payment_status as ReceiptPaymentStatus,
            householdId: data.household_id || undefined,
            pickerId: data.picker_id || undefined,
            recyclerId: data.recycler_id || undefined,
            issuedAt: data.issued_at,
          };
        }
      } catch (e) {
        if (__DEV__) console.warn('[receiptsApi.getReceipt] Network error:', e);
      }
    }

    return localReceipts.find((r) => r.id === receiptId) || null;
  },

  async createReceipt(
    receiptData: Omit<Receipt, 'id' | 'issuedAt' | 'receiptNumber'>
  ): Promise<Receipt> {
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .insert({
            job_id: receiptData.jobId || null,
            receipt_number: receiptNumber,
            material: receiptData.material,
            measured_kg: receiptData.measuredKg,
            rate_per_kg: receiptData.ratePerKg,
            line_items: (receiptData.lineItems as any) || [],
            total: receiptData.total,
            payment_status: receiptData.paymentStatus || 'pending',
            household_id: receiptData.householdId || null,
            picker_id: receiptData.pickerId || null,
            recycler_id: receiptData.recyclerId || null,
          })
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[receiptsApi.createReceipt] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created: Receipt = {
            id: data.id,
            jobId: data.job_id || undefined,
            receiptNumber: data.receipt_number,
            material: data.material,
            measuredKg: Number(data.measured_kg),
            ratePerKg: Number(data.rate_per_kg),
            lineItems: (data.line_items as any) || [],
            total: Number(data.total),
            paymentStatus: data.payment_status as ReceiptPaymentStatus,
            householdId: data.household_id || undefined,
            pickerId: data.picker_id || undefined,
            recyclerId: data.recycler_id || undefined,
            issuedAt: data.issued_at,
          };
          localReceipts.unshift(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[receiptsApi.createReceipt] Network error:', e);
      }
    }

    const created: Receipt = {
      ...receiptData,
      id: `receipt-${Date.now().toString(36)}`,
      receiptNumber,
      issuedAt: new Date().toISOString(),
    };
    localReceipts.unshift(created);
    return created;
  },

  async updatePaymentStatus(receiptId: string, status: ReceiptPaymentStatus): Promise<Receipt> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .update({
            payment_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', receiptId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[receiptsApi.updatePaymentStatus] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const updated: Receipt = {
            id: data.id,
            jobId: data.job_id || undefined,
            receiptNumber: data.receipt_number,
            material: data.material,
            measuredKg: Number(data.measured_kg),
            ratePerKg: Number(data.rate_per_kg),
            lineItems: (data.line_items as any) || [],
            total: Number(data.total),
            paymentStatus: data.payment_status as ReceiptPaymentStatus,
            issuedAt: data.issued_at,
          };
          const idx = localReceipts.findIndex((r) => r.id === receiptId);
          if (idx !== -1) localReceipts[idx] = updated;
          return updated;
        }
      } catch (e) {
        if (__DEV__) console.warn('[receiptsApi.updatePaymentStatus] Network error:', e);
      }
    }

    const idx = localReceipts.findIndex((r) => r.id === receiptId);
    if (idx === -1) throw new Error('Receipt not found');
    const updated: Receipt = { ...localReceipts[idx], paymentStatus: status };
    localReceipts[idx] = updated;
    return updated;
  },
};
