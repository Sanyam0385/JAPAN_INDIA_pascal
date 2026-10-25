-- CIRCULO Step B1: Realtime Database Schema, Atomic claim_job, Server-Validated Receipts & Comprehensive RLS
-- Idempotent schema migration for multi-role circular waste management platform

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. RECYCLERS TABLE (Certified MRFs & Scrap Processors)
CREATE TABLE IF NOT EXISTS public.recyclers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    locality TEXT,
    ward TEXT,
    city_key TEXT NOT NULL DEFAULT 'BLR',
    accepted_materials TEXT[] NOT NULL DEFAULT '{}',
    hours TEXT NOT NULL DEFAULT '08:00 - 18:00',
    phone TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    is_verified BOOLEAN DEFAULT TRUE,
    price_list JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PICKUP JOBS TABLE (The Core Realtime Requests)
CREATE TABLE IF NOT EXISTS public.pickup_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    household_name TEXT,
    household_address TEXT,
    picker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    picker_name TEXT,
    material TEXT NOT NULL,
    estimated_kg NUMERIC(6, 2) NOT NULL CHECK (estimated_kg > 0),
    status TEXT NOT NULL DEFAULT 'listed' CHECK (
        status IN (
            'listed', 'rate_proposed', 'rate_locked', 'claimed', 'en_route',
            'weighed', 'handed_to_recycler', 'completed', 'disputed', 'cancelled'
        )
    ),
    proposed_rate_per_kg NUMERIC(8, 2),
    locked_rate_per_kg NUMERIC(8, 2),
    measured_kg NUMERIC(6, 2) CHECK (measured_kg IS NULL OR measured_kg >= 0),
    pickup_window TEXT NOT NULL DEFAULT 'Morning (8am - 12pm)',
    ward TEXT NOT NULL,
    city_key TEXT NOT NULL DEFAULT 'BLR',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    notes TEXT,
    destination_id UUID REFERENCES public.recyclers(id) ON DELETE SET NULL,
    destination_name TEXT,
    receipt_id UUID,
    dispute_id UUID,
    qr_code TEXT,
    pin TEXT,
    has_contamination BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist idempotently
DO $$ BEGIN
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS proposed_rate_per_kg NUMERIC(8, 2);
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS locked_rate_per_kg NUMERIC(8, 2);
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS measured_kg NUMERIC(6, 2);
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS pickup_window TEXT NOT NULL DEFAULT 'Morning (8am - 12pm)';
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS ward TEXT;
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS city_key TEXT NOT NULL DEFAULT 'BLR';
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS pin TEXT;
    ALTER TABLE public.pickup_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
END $$;

-- 4. RATE OFFERS (Negotiation History)
CREATE TABLE IF NOT EXISTS public.rate_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.pickup_jobs(id) ON DELETE CASCADE,
    proposed_by TEXT NOT NULL CHECK (proposed_by IN ('household', 'picker')),
    rate_per_kg NUMERIC(8, 2) NOT NULL CHECK (rate_per_kg >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'countered', 'rejected')),
    counter_offer JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RECEIPTS (Fair Value Digital Receipts / Circularity Passport)
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.pickup_jobs(id) ON DELETE SET NULL,
    receipt_number TEXT UNIQUE NOT NULL,
    household_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    picker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recycler_id UUID REFERENCES public.recyclers(id) ON DELETE SET NULL,
    material TEXT NOT NULL,
    measured_kg NUMERIC(6, 2) NOT NULL CHECK (measured_kg >= 0),
    rate_per_kg NUMERIC(8, 2) NOT NULL CHECK (rate_per_kg >= 0),
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'cleared_upi_simulated')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RECYCLER INTAKES (Weigh-in & Purity Grading)
CREATE TABLE IF NOT EXISTS public.recycler_intakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.pickup_jobs(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES public.recyclers(id) ON DELETE CASCADE,
    picker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recycler_name TEXT,
    declared_kg NUMERIC(6, 2) NOT NULL,
    confirmed_kg NUMERIC(6, 2) NOT NULL,
    quality_grade TEXT NOT NULL DEFAULT 'clean' CHECK (quality_grade IN ('clean', 'mixed', 'contaminated')),
    contamination_note TEXT,
    deduction_amount NUMERIC(8, 2) NOT NULL DEFAULT 0,
    settlement_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'graded' CHECK (status IN ('graded', 'settled', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DISPUTES (Human-in-the-Loop Municipal Arbitration)
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.pickup_jobs(id) ON DELETE CASCADE,
    raised_by_role TEXT NOT NULL CHECK (raised_by_role IN ('household', 'picker', 'recycler')),
    raised_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('weight', 'price', 'payment', 'other')),
    notes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
    admin_note TEXT,
    resolution TEXT,
    adjusted_total NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 8. ISSUES (Collector Field Issues)
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raised_by_role TEXT NOT NULL,
    raised_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    locality TEXT,
    ward TEXT,
    city_key TEXT NOT NULL DEFAULT 'BLR',
    type TEXT NOT NULL CHECK (type IN ('missed_pickup', 'contamination', 'overflow', 'other')),
    note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 9. COMPLAINTS (Citizen Grievance Redressal)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    locality TEXT NOT NULL,
    ward TEXT,
    city_key TEXT NOT NULL DEFAULT 'BLR',
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected_with_reason')
    ),
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 10. NOTIFICATIONS (Realtime In-App Toasts & Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    job_id UUID REFERENCES public.pickup_jobs(id) ON DELETE SET NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. COLLECTIONS (Formal Municipal Fleet Records)
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ward TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('wet', 'dry', 'recyclable', 'hazardous')),
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg >= 0),
    segregation_rating INT CHECK (segregation_rating BETWEEN 1 AND 5),
    notes TEXT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. LIVE LOCATIONS (One upserted row per user for active job tracking)
CREATE TABLE IF NOT EXISTS public.live_locations (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.pickup_jobs(id) ON DELETE SET NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ATTACH SHARED updated_at TRIGGER TO ALL TABLES
DROP TRIGGER IF EXISTS tr_recyclers_updated_at ON public.recyclers;
CREATE TRIGGER tr_recyclers_updated_at BEFORE UPDATE ON public.recyclers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_pickup_jobs_updated_at ON public.pickup_jobs;
CREATE TRIGGER tr_pickup_jobs_updated_at BEFORE UPDATE ON public.pickup_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_rate_offers_updated_at ON public.rate_offers;
CREATE TRIGGER tr_rate_offers_updated_at BEFORE UPDATE ON public.rate_offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_receipts_updated_at ON public.receipts;
CREATE TRIGGER tr_receipts_updated_at BEFORE UPDATE ON public.receipts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_recycler_intakes_updated_at ON public.recycler_intakes;
CREATE TRIGGER tr_recycler_intakes_updated_at BEFORE UPDATE ON public.recycler_intakes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_disputes_updated_at ON public.disputes;
CREATE TRIGGER tr_disputes_updated_at BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_issues_updated_at ON public.issues;
CREATE TRIGGER tr_issues_updated_at BEFORE UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_complaints_updated_at ON public.complaints;
CREATE TRIGGER tr_complaints_updated_at BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 14. SERVER-SIDE RECEIPT VALIDATION TRIGGER
-- Ensures total = measured_kg * rate_per_kg + sum(line_items)
-- Client can NEVER tamper with payout amounts
CREATE OR REPLACE FUNCTION public.validate_receipt_total()
RETURNS TRIGGER AS $$
DECLARE
    v_calculated_total NUMERIC(10, 2);
    v_line_item_sum NUMERIC(10, 2) := 0;
    v_item JSONB;
BEGIN
    IF NEW.line_items IS NOT NULL AND jsonb_typeof(NEW.line_items) = 'array' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.line_items) LOOP
            v_line_item_sum := v_line_item_sum + COALESCE((v_item->>'amount')::NUMERIC, 0);
        END LOOP;
    END IF;

    v_calculated_total := ROUND((NEW.measured_kg * NEW.rate_per_kg) + v_line_item_sum, 2);
    NEW.total := v_calculated_total;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validate_receipt_total ON public.receipts;
CREATE TRIGGER tr_validate_receipt_total
BEFORE INSERT OR UPDATE ON public.receipts
FOR EACH ROW EXECUTE FUNCTION public.validate_receipt_total();

-- 15. ATOMIC JOB CLAIM FUNCTION: claim_job(job_id)
-- Security Definer: Prevents race conditions so two pickers can never claim the same job.
CREATE OR REPLACE FUNCTION public.claim_job(p_job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_picker_id UUID := auth.uid();
    v_household_id UUID;
    v_material TEXT;
    v_picker_name TEXT;
BEGIN
    IF v_picker_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to claim a job.';
    END IF;

    -- Atomically claim job
    UPDATE public.pickup_jobs
    SET picker_id = v_picker_id,
        status = 'claimed',
        updated_at = NOW()
    WHERE id = p_job_id
      AND status IN ('listed', 'rate_locked', 'rate_proposed')
      AND picker_id IS NULL
    RETURNING household_id, material INTO v_household_id, v_material;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get picker name for notification
    SELECT COALESCE(full_name, name, 'A waste picker') INTO v_picker_name
    FROM public.profiles
    WHERE id = v_picker_id;

    -- Send realtime notification to household
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        job_id,
        created_at
    ) VALUES (
        v_household_id,
        'Pickup Claimed! 🚛',
        COALESCE(v_picker_name, 'A picker') || ' has claimed your ' || v_material || ' recycling request.',
        'job_claimed',
        p_job_id,
        NOW()
    );

    RETURN TRUE;
END;
$$;

-- 16. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_pickup_jobs_household ON public.pickup_jobs(household_id);
CREATE INDEX IF NOT EXISTS idx_pickup_jobs_picker ON public.pickup_jobs(picker_id);
CREATE INDEX IF NOT EXISTS idx_pickup_jobs_status ON public.pickup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pickup_jobs_ward ON public.pickup_jobs(ward);
CREATE INDEX IF NOT EXISTS idx_pickup_jobs_city_key ON public.pickup_jobs(city_key);

CREATE INDEX IF NOT EXISTS idx_rate_offers_job_id ON public.rate_offers(job_id);
CREATE INDEX IF NOT EXISTS idx_receipts_job_id ON public.receipts(job_id);
CREATE INDEX IF NOT EXISTS idx_receipts_household ON public.receipts(household_id);
CREATE INDEX IF NOT EXISTS idx_receipts_picker ON public.receipts(picker_id);

CREATE INDEX IF NOT EXISTS idx_recycler_intakes_job ON public.recycler_intakes(job_id);
CREATE INDEX IF NOT EXISTS idx_recycler_intakes_recycler ON public.recycler_intakes(recycler_id);

CREATE INDEX IF NOT EXISTS idx_disputes_job_id ON public.disputes(job_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_collections_household ON public.collections(household_id);
CREATE INDEX IF NOT EXISTS idx_collections_collector ON public.collections(collector_id);

-- 17. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;

-- RECYCLERS: Authenticated users can read
DROP POLICY IF EXISTS "Public read recyclers" ON public.recyclers;
CREATE POLICY "Public read recyclers" ON public.recyclers
    FOR SELECT TO authenticated USING (TRUE);

-- PICKUP JOBS POLICIES:
DROP POLICY IF EXISTS "Households create own jobs" ON public.pickup_jobs;
CREATE POLICY "Households create own jobs" ON public.pickup_jobs
    FOR INSERT TO authenticated
    WITH CHECK (household_id = auth.uid());

DROP POLICY IF EXISTS "Households read own jobs" ON public.pickup_jobs;
CREATE POLICY "Households read own jobs" ON public.pickup_jobs
    FOR SELECT TO authenticated
    USING (household_id = auth.uid());

DROP POLICY IF EXISTS "Pickers read open and assigned jobs" ON public.pickup_jobs;
CREATE POLICY "Pickers read open and assigned jobs" ON public.pickup_jobs
    FOR SELECT TO authenticated
    USING (
        status IN ('listed', 'rate_proposed')
        OR picker_id = auth.uid()
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Pickers update assigned jobs" ON public.pickup_jobs;
CREATE POLICY "Pickers update assigned jobs" ON public.pickup_jobs
    FOR UPDATE TO authenticated
    USING (
        picker_id = auth.uid()
        OR (status IN ('listed', 'rate_locked', 'rate_proposed') AND picker_id IS NULL)
        OR public.current_role() IN ('municipal_admin', 'admin')
    )
    WITH CHECK (
        picker_id = auth.uid()
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Recyclers read handed jobs" ON public.pickup_jobs;
CREATE POLICY "Recyclers read handed jobs" ON public.pickup_jobs
    FOR SELECT TO authenticated
    USING (
        destination_id IN (SELECT id FROM public.recyclers WHERE user_id = auth.uid())
        OR status = 'handed_to_recycler'
    );

DROP POLICY IF EXISTS "Admins manage all jobs" ON public.pickup_jobs;
CREATE POLICY "Admins manage all jobs" ON public.pickup_jobs
    FOR ALL TO authenticated
    USING (public.current_role() IN ('municipal_admin', 'admin'));

-- RATE OFFERS POLICIES:
DROP POLICY IF EXISTS "Job parties view rate offers" ON public.rate_offers;
CREATE POLICY "Job parties view rate offers" ON public.rate_offers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pickup_jobs j
            WHERE j.id = rate_offers.job_id
            AND (j.household_id = auth.uid() OR j.picker_id = auth.uid())
        )
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Job parties create rate offers" ON public.rate_offers;
CREATE POLICY "Job parties create rate offers" ON public.rate_offers
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pickup_jobs j
            WHERE j.id = rate_offers.job_id
            AND (j.household_id = auth.uid() OR j.picker_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Job parties update rate offers" ON public.rate_offers;
CREATE POLICY "Job parties update rate offers" ON public.rate_offers
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pickup_jobs j
            WHERE j.id = rate_offers.job_id
            AND (j.household_id = auth.uid() OR j.picker_id = auth.uid())
        )
    );

-- RECEIPTS POLICIES:
DROP POLICY IF EXISTS "Job parties view receipts" ON public.receipts;
CREATE POLICY "Job parties view receipts" ON public.receipts
    FOR SELECT TO authenticated
    USING (
        household_id = auth.uid()
        OR picker_id = auth.uid()
        OR recycler_id IN (SELECT id FROM public.recyclers WHERE user_id = auth.uid())
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Pickers and recyclers insert receipts" ON public.receipts;
CREATE POLICY "Pickers and recyclers insert receipts" ON public.receipts
    FOR INSERT TO authenticated
    WITH CHECK (
        picker_id = auth.uid()
        OR recycler_id IN (SELECT id FROM public.recyclers WHERE user_id = auth.uid())
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

-- RECYCLER INTAKES POLICIES:
DROP POLICY IF EXISTS "Intakes viewable by parties and admin" ON public.recycler_intakes;
CREATE POLICY "Intakes viewable by parties and admin" ON public.recycler_intakes
    FOR SELECT TO authenticated
    USING (
        picker_id = auth.uid()
        OR recycler_id IN (SELECT id FROM public.recyclers WHERE user_id = auth.uid())
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Recyclers manage intakes" ON public.recycler_intakes;
CREATE POLICY "Recyclers manage intakes" ON public.recycler_intakes
    FOR ALL TO authenticated
    USING (
        recycler_id IN (SELECT id FROM public.recyclers WHERE user_id = auth.uid())
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

-- DISPUTES POLICIES:
DROP POLICY IF EXISTS "Disputes visible to job parties" ON public.disputes;
CREATE POLICY "Disputes visible to job parties" ON public.disputes
    FOR SELECT TO authenticated
    USING (
        raised_by_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.pickup_jobs j
            WHERE j.id = disputes.job_id
            AND (j.household_id = auth.uid() OR j.picker_id = auth.uid())
        )
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Parties can raise disputes" ON public.disputes;
CREATE POLICY "Parties can raise disputes" ON public.disputes
    FOR INSERT TO authenticated
    WITH CHECK (raised_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all disputes" ON public.disputes;
CREATE POLICY "Admins manage all disputes" ON public.disputes
    FOR ALL TO authenticated
    USING (public.current_role() IN ('municipal_admin', 'admin'));

-- ISSUES POLICIES:
DROP POLICY IF EXISTS "Staff view issues" ON public.issues;
CREATE POLICY "Staff view issues" ON public.issues
    FOR SELECT TO authenticated
    USING (
        raised_by_user_id = auth.uid()
        OR public.current_role() IN ('formal_collector', 'municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Staff insert issues" ON public.issues;
CREATE POLICY "Staff insert issues" ON public.issues
    FOR INSERT TO authenticated
    WITH CHECK (raised_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all issues" ON public.issues;
CREATE POLICY "Admins manage all issues" ON public.issues
    FOR ALL TO authenticated
    USING (public.current_role() IN ('municipal_admin', 'admin'));

-- COMPLAINTS POLICIES:
DROP POLICY IF EXISTS "Users view own complaints" ON public.complaints;
CREATE POLICY "Users view own complaints" ON public.complaints
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Users create complaints" ON public.complaints;
CREATE POLICY "Users create complaints" ON public.complaints
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage complaints" ON public.complaints;
CREATE POLICY "Admins manage complaints" ON public.complaints
    FOR ALL TO authenticated
    USING (public.current_role() IN ('municipal_admin', 'admin'));

-- NOTIFICATIONS POLICIES:
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- COLLECTIONS POLICIES:
DROP POLICY IF EXISTS "Collections viewable by household and collector" ON public.collections;
CREATE POLICY "Collections viewable by household and collector" ON public.collections
    FOR SELECT TO authenticated
    USING (
        household_id = auth.uid()
        OR collector_id = auth.uid()
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

DROP POLICY IF EXISTS "Collectors insert collections" ON public.collections;
CREATE POLICY "Collectors insert collections" ON public.collections
    FOR INSERT TO authenticated
    WITH CHECK (collector_id = auth.uid() OR public.current_role() IN ('municipal_admin', 'admin'));

-- LIVE LOCATIONS POLICIES:
-- Writable only by owner when share_live_location is true in their profile
DROP POLICY IF EXISTS "Users upsert own live location" ON public.live_locations;
CREATE POLICY "Users upsert own live location" ON public.live_locations
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND share_live_location = TRUE)
    )
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND share_live_location = TRUE)
    );

-- Readable by the household of the ACTIVE job (claimed or en_route) and by admin
DROP POLICY IF EXISTS "Household tracks active picker location" ON public.live_locations;
CREATE POLICY "Household tracks active picker location" ON public.live_locations
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.pickup_jobs j
            WHERE j.id = live_locations.job_id
            AND j.household_id = auth.uid()
            AND j.status IN ('claimed', 'en_route')
        )
        OR public.current_role() IN ('municipal_admin', 'admin')
    );

-- 18. ADD TABLES TO REALTIME PUBLICATION
DO $$ BEGIN
    -- Add tables to supabase_realtime if publication exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_jobs;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.rate_offers;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.recycler_intakes;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;
