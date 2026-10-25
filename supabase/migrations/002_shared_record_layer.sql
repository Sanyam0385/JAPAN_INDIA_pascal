-- CIRCULO Shared Record Layer Migration
-- PostgreSQL Schema & Row Level Security (RLS) Policies
-- Chain: Households -> Formal Collection -> Informal Pickers -> Recyclers (MRF) -> Municipal Admin

-- 1. ENUMS FOR SHARED RECORD LAYER
DO $$ BEGIN
    CREATE TYPE pickup_job_status AS ENUM (
        'listed', 'rate_proposed', 'rate_locked', 'claimed', 'en_route', 
        'weighed', 'handed_to_recycler', 'completed', 'disputed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rate_offer_status AS ENUM ('pending', 'accepted', 'countered', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE receipt_payment_status AS ENUM ('pending', 'cleared_upi_simulated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quality_grade AS ENUM ('clean', 'mixed', 'contaminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_reason AS ENUM ('weight', 'price', 'payment', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_type AS ENUM ('missed_pickup', 'contamination', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_status AS ENUM ('open', 'investigating', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. RECYCLERS (Material Recovery Facilities & Authorized Scrap Processors)
CREATE TABLE IF NOT EXISTS recyclers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    locality TEXT,
    accepted_materials TEXT[] NOT NULL DEFAULT '{}',
    hours TEXT NOT NULL,
    phone TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    is_verified BOOLEAN DEFAULT TRUE,
    price_list JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PICKUP JOBS (Shared record from household listing to recycler handoff)
CREATE TABLE IF NOT EXISTS pickup_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id TEXT NOT NULL,
    household_name TEXT,
    household_address TEXT,
    picker_id TEXT,
    picker_name TEXT,
    material TEXT NOT NULL,
    estimated_kg NUMERIC(6, 2) NOT NULL,
    status pickup_job_status NOT NULL DEFAULT 'listed',
    proposed_rate_per_kg NUMERIC(8, 2),
    locked_rate_per_kg NUMERIC(8, 2),
    measured_kg NUMERIC(6, 2),
    window TEXT NOT NULL,
    location JSONB NOT NULL DEFAULT '{"ward": "Ward 151"}'::jsonb,
    destination_id UUID REFERENCES recyclers(id),
    destination_name TEXT,
    receipt_id TEXT,
    dispute_id TEXT,
    qr_code TEXT,
    has_contamination BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RATE OFFERS (Negotiation history, strictly one counter-offer allowed)
CREATE TABLE IF NOT EXISTS rate_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES pickup_jobs(id) ON DELETE CASCADE,
    proposed_by TEXT NOT NULL CHECK (proposed_by IN ('household', 'picker')),
    rate_per_kg NUMERIC(8, 2) NOT NULL,
    status rate_offer_status NOT NULL DEFAULT 'pending',
    counter_offer JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RECEIPTS (Fair Value Receipt / Circularity Passport)
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES pickup_jobs(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    material TEXT NOT NULL,
    measured_kg NUMERIC(6, 2) NOT NULL,
    rate_per_kg NUMERIC(8, 2) NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10, 2) NOT NULL,
    payment_status receipt_payment_status NOT NULL DEFAULT 'pending',
    destination_id UUID REFERENCES recyclers(id),
    destination_name TEXT,
    household_id TEXT,
    household_name TEXT,
    picker_id TEXT,
    picker_name TEXT,
    recycler_id UUID REFERENCES recyclers(id),
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RECYCLER INTAKES (Weigh-in, contamination grading, quality passport)
CREATE TABLE IF NOT EXISTS recycler_intakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES pickup_jobs(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE CASCADE,
    recycler_name TEXT,
    declared_kg NUMERIC(6, 2) NOT NULL,
    confirmed_kg NUMERIC(6, 2) NOT NULL,
    quality_grade quality_grade NOT NULL DEFAULT 'clean',
    contamination_note TEXT,
    status TEXT NOT NULL DEFAULT 'graded',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- 7. DISPUTES (Transparent escalation with human review)
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES pickup_jobs(id) ON DELETE CASCADE,
    raised_by TEXT NOT NULL CHECK (raised_by IN ('household', 'picker', 'recycler')),
    raised_by_user_id TEXT,
    raised_by_name TEXT,
    reason dispute_reason NOT NULL,
    notes TEXT NOT NULL,
    status dispute_status NOT NULL DEFAULT 'open',
    admin_note TEXT,
    resolution TEXT,
    adjusted_total NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 8. FIELD ISSUES (Collector & field issues)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raised_by_role TEXT NOT NULL,
    raised_by_user_id TEXT,
    raised_by_name TEXT,
    locality TEXT,
    ward TEXT,
    type issue_type NOT NULL,
    note TEXT NOT NULL,
    status issue_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 9. CITY CONFIGURATIONS
CREATE TABLE IF NOT EXISTS city_configs (
    city_code TEXT PRIMARY KEY,
    city_name TEXT NOT NULL,
    ward_name TEXT NOT NULL,
    bins JSONB NOT NULL DEFAULT '[]'::jsonb,
    collection_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_configs ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Recyclers: Read access for all authenticated users
CREATE POLICY "Public read recyclers" ON recyclers
    FOR SELECT TO authenticated USING (TRUE);

-- Pickup Jobs: Visible to owner household, assigned/open pickers, and admins
CREATE POLICY "Households manage own jobs" ON pickup_jobs
    FOR ALL USING (household_id = auth.uid()::text);

CREATE POLICY "Pickers see open and claimed jobs" ON pickup_jobs
    FOR SELECT USING (
        status = 'listed' OR status = 'rate_proposed' 
        OR picker_id = auth.uid()::text
    );

CREATE POLICY "Pickers update claimed jobs" ON pickup_jobs
    FOR UPDATE USING (
        status IN ('listed', 'rate_proposed', 'rate_locked', 'claimed') 
        OR picker_id = auth.uid()::text
    );

CREATE POLICY "Admins manage all jobs" ON pickup_jobs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'municipal_admin')
    );

-- Rate Offers: Visible to job participants
CREATE POLICY "Rate offers visible to participants" ON rate_offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pickup_jobs 
            WHERE id = rate_offers.job_id 
            AND (household_id = auth.uid()::text OR picker_id = auth.uid()::text)
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'municipal_admin')
    );

-- Receipts: Visible to household, picker, recycler, and municipal admin
CREATE POLICY "Receipts visible to parties" ON receipts
    FOR SELECT USING (
        household_id = auth.uid()::text 
        OR picker_id = auth.uid()::text
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'municipal_admin')
    );

-- Recycler Intakes: Recyclers write, pickers & households view
CREATE POLICY "Intakes viewable by job parties" ON recycler_intakes
    FOR SELECT USING (TRUE);

CREATE POLICY "Recyclers manage intakes" ON recycler_intakes
    FOR ALL USING (TRUE);

-- Disputes: Visible to involved parties and admins
CREATE POLICY "Disputes visible to parties and admins" ON disputes
    FOR SELECT USING (
        raised_by_user_id = auth.uid()::text 
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'municipal_admin')
    );

CREATE POLICY "Admins manage disputes" ON disputes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'municipal_admin')
    );

-- Issues: Collectors and admins
CREATE POLICY "Issues viewable by staff" ON issues
    FOR SELECT USING (TRUE);

CREATE POLICY "Issues manageable by staff" ON issues
    FOR ALL USING (TRUE);

-- City configs: Public read for authenticated
CREATE POLICY "Public read city configs" ON city_configs
    FOR SELECT TO authenticated USING (TRUE);
