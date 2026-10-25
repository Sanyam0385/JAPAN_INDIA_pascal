-- CIRCULO Step B5: Collector Routes, Route Stops & Live Location Role
-- Idempotent schema migration for municipal collection route management

-- 1. ADD ROLE COLUMN TO LIVE_LOCATIONS IF NOT PRESENT
ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. COLLECTOR ROUTES TABLE
CREATE TABLE IF NOT EXISTS public.collector_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    collector_name TEXT NOT NULL DEFAULT 'Collector Fleet',
    vehicle_number TEXT DEFAULT 'KA-01-EA-4412',
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ward TEXT NOT NULL DEFAULT 'Koramangala Ward 151',
    city_key TEXT NOT NULL DEFAULT 'BLR',
    truck_capacity_kg NUMERIC(8, 2) NOT NULL DEFAULT 5000.0,
    current_load_kg NUMERIC(8, 2) NOT NULL DEFAULT 3200.0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    total_stops INT NOT NULL DEFAULT 12,
    completed_stops INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist idempotently
DO $$ BEGIN
    ALTER TABLE public.collector_routes ADD COLUMN IF NOT EXISTS vehicle_number TEXT DEFAULT 'KA-01-EA-4412';
    ALTER TABLE public.collector_routes ADD COLUMN IF NOT EXISTS truck_capacity_kg NUMERIC(8, 2) NOT NULL DEFAULT 5000.0;
    ALTER TABLE public.collector_routes ADD COLUMN IF NOT EXISTS current_load_kg NUMERIC(8, 2) NOT NULL DEFAULT 3200.0;
    ALTER TABLE public.collector_routes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    ALTER TABLE public.collector_routes ADD COLUMN IF NOT EXISTS total_stops INT NOT NULL DEFAULT 12;
    ALTER TABLE public.collector_routes ADD COLUMN IF NOT EXISTS completed_stops INT NOT NULL DEFAULT 0;
END $$;

-- 3. ROUTE STOPS TABLE
CREATE TABLE IF NOT EXISTS public.route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES public.collector_routes(id) ON DELETE CASCADE,
    sequence INT NOT NULL,
    household_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    house_number TEXT NOT NULL,
    address TEXT NOT NULL,
    locality TEXT NOT NULL DEFAULT 'Koramangala',
    ward TEXT DEFAULT 'Ward 151',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    waste_type TEXT NOT NULL DEFAULT 'wet' CHECK (waste_type IN ('wet', 'dry', 'recyclable', 'hazardous')),
    time_slot TEXT NOT NULL DEFAULT '08:00',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'current', 'completed', 'skipped')),
    collected_kg NUMERIC(6, 2),
    segregation_rating INT CHECK (segregation_rating IS NULL OR (segregation_rating >= 1 AND segregation_rating <= 5)),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist idempotently
DO $$ BEGIN
    ALTER TABLE public.route_stops ADD COLUMN IF NOT EXISTS collected_kg NUMERIC(6, 2);
    ALTER TABLE public.route_stops ADD COLUMN IF NOT EXISTS segregation_rating INT;
    ALTER TABLE public.route_stops ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
    ALTER TABLE public.route_stops ADD COLUMN IF NOT EXISTS notes TEXT;
END $$;

-- 4. ATTACH updated_at TRIGGERS
DROP TRIGGER IF EXISTS tr_collector_routes_updated_at ON public.collector_routes;
CREATE TRIGGER tr_collector_routes_updated_at BEFORE UPDATE ON public.collector_routes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_route_stops_updated_at ON public.route_stops;
CREATE TRIGGER tr_route_stops_updated_at BEFORE UPDATE ON public.route_stops
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.collector_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
DROP POLICY IF EXISTS "collector_routes_read" ON public.collector_routes;
CREATE POLICY "collector_routes_read" ON public.collector_routes
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "collector_routes_write" ON public.collector_routes;
CREATE POLICY "collector_routes_write" ON public.collector_routes
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "route_stops_read" ON public.route_stops;
CREATE POLICY "route_stops_read" ON public.route_stops
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "route_stops_write" ON public.route_stops;
CREATE POLICY "route_stops_write" ON public.route_stops
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 7. REALTIME PUBLICATION
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.collector_routes;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.route_stops;
        EXCEPTION WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;
