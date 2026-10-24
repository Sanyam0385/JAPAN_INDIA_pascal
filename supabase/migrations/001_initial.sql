-- CIRCULO Unified Circular Waste Management Platform
-- PostgreSQL Schema & Row Level Security (RLS) Policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TYPE user_role AS ENUM ('household', 'formal_collector', 'informal_picker', 'municipal_admin');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'household',
    name TEXT NOT NULL,
    phone TEXT,
    preferred_language TEXT DEFAULT 'en',
    locality TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HOUSEHOLDS
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    locality TEXT NOT NULL,
    ward TEXT NOT NULL,
    member_count INT DEFAULT 4,
    reward_points INT DEFAULT 0,
    segregation_score INT DEFAULT 85,
    is_segregating BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COLLECTION SCHEDULES
CREATE TYPE waste_category AS ENUM ('wet', 'dry', 'recyclable', 'hazardous');
CREATE TYPE schedule_status AS ENUM ('scheduled', 'completed', 'missed', 'delayed', 'cancelled');

CREATE TABLE collection_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward TEXT NOT NULL,
    locality TEXT NOT NULL,
    category waste_category NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    assigned_vehicle TEXT,
    assigned_driver_id UUID REFERENCES profiles(id),
    status schedule_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COLLECTION RECORDS (Recorded by formal collectors)
CREATE TABLE collection_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES collection_schedules(id),
    household_id UUID REFERENCES households(id),
    collector_id UUID REFERENCES profiles(id),
    category waste_category NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL,
    segregation_rating INT CHECK (segregation_rating BETWEEN 1 AND 5),
    photo_url TEXT,
    notes TEXT,
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RECYCLING REQUESTS (Household to Informal Picker Marketplace)
CREATE TYPE recycling_status AS ENUM (
    'draft', 'open', 'accepted', 'en_route', 'collected', 'payment_pending', 'completed', 'cancelled', 'disputed'
);

CREATE TABLE recycling_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    material_category TEXT NOT NULL,
    approximate_quantity_kg NUMERIC(6, 2) NOT NULL,
    quantity_unit TEXT DEFAULT 'kg',
    status recycling_status DEFAULT 'open',
    pickup_address TEXT NOT NULL,
    preferred_pickup_window TEXT NOT NULL,
    assigned_picker_id UUID REFERENCES profiles(id),
    estimated_price_min NUMERIC(8, 2),
    estimated_price_max NUMERIC(8, 2),
    agreed_price NUMERIC(8, 2),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RECYCLING BUYERS (Directory of scrap yards and processing plants)
CREATE TABLE recycling_buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    locality TEXT NOT NULL,
    accepted_materials TEXT[] NOT NULL,
    price_list JSONB DEFAULT '{}'::jsonb,
    operating_hours TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 4.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. GRIEVANCES & COMPLAINTS
CREATE TYPE complaint_status AS ENUM (
    'submitted', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected_with_reason'
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id),
    household_id UUID REFERENCES households(id),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    locality TEXT NOT NULL,
    status complaint_status DEFAULT 'submitted',
    photo_url TEXT,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VOLUNTEER CLEANUP EVENTS
CREATE TABLE volunteer_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    locality TEXT NOT NULL,
    meeting_point TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_participants INT DEFAULT 50,
    registered_count INT DEFAULT 0,
    organiser TEXT NOT NULL,
    reward_points INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile, municipal admins can view all
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Recycling Requests: Households see their own, pickers can see all 'open' requests
CREATE POLICY "Households see own requests" ON recycling_requests FOR SELECT USING (household_id IN (SELECT id FROM households WHERE user_id = auth.uid()));
CREATE POLICY "Pickers see open requests" ON recycling_requests FOR SELECT USING (status = 'open' OR assigned_picker_id = auth.uid());
CREATE POLICY "Pickers claim open requests" ON recycling_requests FOR UPDATE USING (status = 'open' OR assigned_picker_id = auth.uid());

-- Complaints: Citizens see own, Admins see all in ward
CREATE POLICY "Users see own complaints" ON complaints FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage all complaints" ON complaints FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'municipal_admin')
);

-- Public read for buyers and volunteer events
CREATE POLICY "Public read buyers" ON recycling_buyers FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Public read events" ON volunteer_events FOR SELECT TO authenticated USING (TRUE);
