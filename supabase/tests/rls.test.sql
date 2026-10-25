-- ============================================================================
-- CIRCULO Security & Row Level Security (RLS) Test Suite
-- ============================================================================
-- Execute this test file in Supabase SQL Editor or via psql:
-- psql -d <database_url> -f supabase/tests/rls.test.sql
-- All tests run inside an isolated transaction that rolls back at the end.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_a_id UUID := gen_random_uuid();
    v_user_b_id UUID := gen_random_uuid();
    v_picker_1_id UUID := gen_random_uuid();
    v_picker_2_id UUID := gen_random_uuid();
    v_job_id UUID;
    v_receipt_id UUID;
    v_claimed BOOLEAN;
    v_count INT;
BEGIN
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'Starting CIRCULO Security & RLS Test Suite...';
    RAISE NOTICE '------------------------------------------------------------';

    -- ------------------------------------------------------------------------
    -- Test Setup: Create mock auth users and profiles
    -- ------------------------------------------------------------------------
    INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at)
    VALUES
        (v_user_a_id, 'user_a@test.circulo.internal', '{"name":"User A","role":"household"}'::jsonb, now()),
        (v_user_b_id, 'user_b@test.circulo.internal', '{"name":"User B","role":"household"}'::jsonb, now()),
        (v_picker_1_id, 'picker_1@test.circulo.internal', '{"name":"Picker 1","role":"informal_picker"}'::jsonb, now()),
        (v_picker_2_id, 'picker_2@test.circulo.internal', '{"name":"Picker 2","role":"informal_picker"}'::jsonb, now());

    INSERT INTO public.profiles (id, email, name, role, ward_name, city_key)
    VALUES
        (v_user_a_id, 'user_a@test.circulo.internal', 'User A', 'household', 'Ward 151', 'BLR'),
        (v_user_b_id, 'user_b@test.circulo.internal', 'User B', 'household', 'Ward 151', 'BLR'),
        (v_picker_1_id, 'picker_1@test.circulo.internal', 'Picker 1', 'informal_picker', 'Ward 151', 'BLR'),
        (v_picker_2_id, 'picker_2@test.circulo.internal', 'Picker 2', 'informal_picker', 'Ward 151', 'BLR');

    -- Create a sample job for User B
    INSERT INTO public.pickup_jobs (
        household_id, household_name, household_address, material, estimated_kg, status, ward, city_key, pickup_window
    ) VALUES (
        v_user_b_id, 'User B', '123 Indiranagar, Bengaluru', 'paper', 15.0, 'listed', 'Ward 151', 'BLR', 'Morning'
    ) RETURNING id INTO v_job_id;

    -- Create a sample receipt for User B
    INSERT INTO public.receipts (
        job_id, receipt_number, material, measured_kg, rate_per_kg, line_items, total, payment_status, household_id, picker_id
    ) VALUES (
        v_job_id, 'REC-TEST-B-001', 'paper', 15.0, 14.0, '[{"label":"15kg Paper","amount":210}]'::jsonb, 210.0, 'cleared_upi_simulated', v_user_b_id, v_picker_1_id
    ) RETURNING id INTO v_receipt_id;

    RAISE NOTICE '[OK] Test fixtures created.';

    -- ------------------------------------------------------------------------
    -- TEST 1: User A cannot read User B's receipts
    -- ------------------------------------------------------------------------
    EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a_id::text, 'role', 'authenticated')::text, true);

    SELECT COUNT(*) INTO v_count FROM public.receipts WHERE id = v_receipt_id;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'TEST 1 FAILED: User A was able to read User B''s receipt!';
    END IF;
    RAISE NOTICE '[PASS] TEST 1: User A cannot read User B''s receipts.';

    -- ------------------------------------------------------------------------
    -- TEST 2: User A cannot update User B's profile role
    -- ------------------------------------------------------------------------
    BEGIN
        UPDATE public.profiles SET role = 'municipal_admin' WHERE id = v_user_b_id;
        IF FOUND THEN
            RAISE EXCEPTION 'TEST 2 FAILED: User A updated User B''s profile!';
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        -- Expected RLS rejection
        NULL;
    END;

    -- Verify User B's role remains unchanged
    RESET ROLE;
    SELECT COUNT(*) INTO v_count FROM public.profiles WHERE id = v_user_b_id AND role = 'household';
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'TEST 2 FAILED: User B''s role was illegally modified!';
    END IF;
    RAISE NOTICE '[PASS] TEST 2: User A cannot update User B''s profile role.';

    -- ------------------------------------------------------------------------
    -- TEST 3: Picker 2 cannot claim a job already claimed by Picker 1 (Atomic Race Prevention)
    -- ------------------------------------------------------------------------
    -- Step 3a: Picker 1 claims the job
    EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_picker_1_id::text, 'role', 'authenticated')::text, true);

    SELECT public.claim_job(v_job_id) INTO v_claimed;
    IF v_claimed IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Picker 1 could not claim available listed job!';
    END IF;

    -- Step 3b: Picker 2 attempts to claim the exact same job
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_picker_2_id::text, 'role', 'authenticated')::text, true);
    SELECT public.claim_job(v_job_id) INTO v_claimed;
    IF v_claimed IS TRUE THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Race condition bug! Picker 2 claimed a job already claimed by Picker 1!';
    END IF;
    RAISE NOTICE '[PASS] TEST 3: Picker cannot claim a job already claimed by another picker.';

    -- ------------------------------------------------------------------------
    -- TEST 4: Household A cannot lock a rate for a job owned by Household B
    -- ------------------------------------------------------------------------
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a_id::text, 'role', 'authenticated')::text, true);

    BEGIN
        UPDATE public.pickup_jobs
        SET locked_rate_per_kg = 25.0, status = 'rate_locked'
        WHERE id = v_job_id;

        IF FOUND THEN
            RAISE EXCEPTION 'TEST 4 FAILED: Household A updated a job owned by Household B!';
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        -- Expected RLS rejection
        NULL;
    END;

    RESET ROLE;
    SELECT COUNT(*) INTO v_count FROM public.pickup_jobs WHERE id = v_job_id AND status = 'rate_locked';
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Job was locked by non-owner!';
    END IF;
    RAISE NOTICE '[PASS] TEST 4: Household cannot lock rate for a job they don''t own.';

    -- ------------------------------------------------------------------------
    -- TEST 5: Anonymous user cannot read any table
    -- ------------------------------------------------------------------------
    EXECUTE 'SET LOCAL ROLE anon';
    PERFORM set_config('request.jwt.claims', '{"role":"anon"}'::text, true);

    SELECT COUNT(*) INTO v_count FROM public.pickup_jobs;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Anonymous user was able to read pickup_jobs!';
    END IF;

    SELECT COUNT(*) INTO v_count FROM public.receipts;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Anonymous user was able to read receipts!';
    END IF;

    SELECT COUNT(*) INTO v_count FROM public.profiles;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Anonymous user was able to read profiles!';
    END IF;

    RAISE NOTICE '[PASS] TEST 5: Anonymous users cannot read any protected tables.';

    -- ------------------------------------------------------------------------
    -- Summary
    -- ------------------------------------------------------------------------
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'ALL 5 ROW LEVEL SECURITY TESTS PASSED SUCCESSFULLY!';
    RAISE NOTICE '------------------------------------------------------------';
END $$;

-- Rollback the test fixtures so no test data remains in the database
ROLLBACK;
