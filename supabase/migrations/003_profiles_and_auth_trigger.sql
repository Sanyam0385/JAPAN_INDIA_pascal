-- CIRCULO Step A3: Profiles Schema, User Trigger & RLS Migration
-- Idempotent migration for profiles, role coercion, and auth.users lifecycle

-- 1. Ensure user_role enum includes all necessary role keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'household', 'formal_collector', 'informal_picker', 'municipal_admin', 'recycler'
        );
    ELSE
        -- Ensure recycler exists in enum
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'recycler';
        EXCEPTION WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- 2. Create or extend profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT '',
    name TEXT,
    role user_role NOT NULL DEFAULT 'household',
    locality TEXT,
    ward TEXT,
    city_key TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    phone TEXT,
    language TEXT DEFAULT 'en',
    avatar_url TEXT,
    share_live_location BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all requested columns exist if profiles was previously created
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ward TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_key TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS share_live_location BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- Synchronize name and full_name for backward compatibility
UPDATE public.profiles SET full_name = COALESCE(full_name, name, 'Circulo User') WHERE full_name IS NULL OR full_name = '';
UPDATE public.profiles SET name = full_name WHERE name IS NULL;

-- 3. Security Definer Helper: current_role() to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- 4. Shared updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Role protection trigger: Users cannot modify their own role
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF current_user <> 'service_role' AND (public.current_role() NOT IN ('municipal_admin', 'admin')) THEN
            RAISE EXCEPTION 'Users cannot change their assigned role.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_protection();

-- 6. handle_new_user trigger on auth.users
-- Self-signup roles are restricted to household, collector, picker.
-- Anything else (admin, recycler) is coerced to household.
-- Admin and recycler accounts can only be created via local seed scripts with service_role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_role TEXT;
    v_coerced_role user_role;
    v_full_name TEXT;
BEGIN
    v_raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'household'));

    -- Self-signup role whitelist & coercion
    IF v_raw_role IN ('household') THEN
        v_coerced_role := 'household';
    ELSIF v_raw_role IN ('formal_collector', 'collector') THEN
        v_coerced_role := 'formal_collector';
    ELSIF v_raw_role IN ('informal_picker', 'picker') THEN
        v_coerced_role := 'informal_picker';
    ELSE
        -- Coerce any attempted admin / recycler self-signups to household
        v_coerced_role := 'household';
    END IF;

    -- If created directly by service_role (e.g. seed script), preserve requested role
    IF current_user = 'service_role' THEN
        IF v_raw_role IN ('municipal_admin', 'admin') THEN
            v_coerced_role := 'municipal_admin';
        ELSIF v_raw_role IN ('recycler') THEN
            v_coerced_role := 'recycler';
        END IF;
    END IF;

    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        name,
        role,
        locality,
        ward,
        city_key,
        lat,
        lng,
        phone,
        language,
        share_live_location,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        v_full_name,
        v_coerced_role,
        NEW.raw_user_meta_data->>'locality',
        COALESCE(NEW.raw_user_meta_data->>'ward', NEW.raw_user_meta_data->>'wardName'),
        COALESCE(NEW.raw_user_meta_data->>'city_key', NEW.raw_user_meta_data->>'cityKey'),
        (NEW.raw_user_meta_data->>'lat')::double precision,
        (NEW.raw_user_meta_data->>'lng')::double precision,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', NEW.raw_user_meta_data->>'language', 'en'),
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        name = EXCLUDED.name,
        locality = EXCLUDED.locality,
        ward = EXCLUDED.ward,
        city_key = EXCLUDED.city_key,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        phone = EXCLUDED.phone,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES ON PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop prior profile policies to ensure strict idempotency
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Anon can read nothing (implicit, but explicit policy guarantees it)
-- Users read only their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Municipal Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.current_role() IN ('municipal_admin', 'admin'));

-- Users update only their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON public.profiles(ward);
CREATE INDEX IF NOT EXISTS idx_profiles_city_key ON public.profiles(city_key);
