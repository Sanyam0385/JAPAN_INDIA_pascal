// Offers API: Rate negotiation & counter-offers
import { supabase, isBackendEnabled } from '../supabase/client';
import { INITIAL_RATE_OFFERS } from '../demo/demoData';
import type { RateOffer, RateOfferStatus } from '../../types';

let localOffers: RateOffer[] = [...INITIAL_RATE_OFFERS];

export const offersApi = {
  async listOffers(jobId: string): Promise<RateOffer[]> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('rate_offers')
          .select('*')
          .eq('job_id', jobId)
          .order('created_at', { ascending: true });

        if (error) {
          if (__DEV__) console.warn('[offersApi.listOffers] Supabase error:', error);
        } else if (data) {
          return data.map((o) => ({
            id: o.id,
            jobId: o.job_id,
            proposedBy: o.proposed_by as 'household' | 'picker',
            ratePerKg: Number(o.rate_per_kg),
            status: o.status as RateOfferStatus,
            counterOffer: o.counter_offer ? (o.counter_offer as any) : undefined,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('[offersApi.listOffers] Network error:', e);
      }
    }

    return localOffers.filter((o) => o.jobId === jobId);
  },

  async createOffer(offerData: Omit<RateOffer, 'id' | 'createdAt' | 'updatedAt'>): Promise<RateOffer> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('rate_offers')
          .insert({
            job_id: offerData.jobId,
            proposed_by: offerData.proposedBy,
            rate_per_kg: offerData.ratePerKg,
            status: offerData.status || 'pending',
            counter_offer: (offerData.counterOffer as any) || null,
          })
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[offersApi.createOffer] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created: RateOffer = {
            id: data.id,
            jobId: data.job_id,
            proposedBy: data.proposed_by as 'household' | 'picker',
            ratePerKg: Number(data.rate_per_kg),
            status: data.status as RateOfferStatus,
            counterOffer: data.counter_offer ? (data.counter_offer as any) : undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          localOffers.push(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[offersApi.createOffer] Network error:', e);
      }
    }

    const created: RateOffer = {
      ...offerData,
      id: `offer-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localOffers.push(created);
    return created;
  },

  async respondOffer(
    offerId: string,
    status: RateOfferStatus,
    counterOffer?: { ratePerKg: number; proposedBy: 'household' | 'picker'; note?: string }
  ): Promise<RateOffer> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('rate_offers')
          .update({
            status,
            counter_offer: (counterOffer as any) || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', offerId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[offersApi.respondOffer] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const updated: RateOffer = {
            id: data.id,
            jobId: data.job_id,
            proposedBy: data.proposed_by as 'household' | 'picker',
            ratePerKg: Number(data.rate_per_kg),
            status: data.status as RateOfferStatus,
            counterOffer: data.counter_offer ? (data.counter_offer as any) : undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          const idx = localOffers.findIndex((o) => o.id === offerId);
          if (idx !== -1) localOffers[idx] = updated;
          return updated;
        }
      } catch (e) {
        if (__DEV__) console.warn('[offersApi.respondOffer] Network error:', e);
      }
    }

    const idx = localOffers.findIndex((o) => o.id === offerId);
    if (idx === -1) throw new Error('Offer not found');
    const updated: RateOffer = {
      ...localOffers[idx],
      status,
      counterOffer: counterOffer
        ? { ...counterOffer, createdAt: new Date().toISOString() }
        : localOffers[idx].counterOffer,
      updatedAt: new Date().toISOString(),
    };
    localOffers[idx] = updated;
    return updated;
  },
};
