-- CIRCULO Demo Data Seed Script
-- All records are clearly labeled as demo / simulated data for hackathon evaluation

-- 1. DEMO RECYCLER
INSERT INTO public.recyclers (
    id,
    name,
    address,
    locality,
    ward,
    city_key,
    accepted_materials,
    hours,
    phone,
    rating,
    is_verified,
    price_list
) VALUES (
    'e0000000-0000-0000-0000-000000000005',
    'EcoPlast Circular MRF [DEMO]',
    'Plot 42, Sector 3, Industrial Area',
    'Industrial Suburb, Yeshwanthpur',
    'Ward 151',
    'BLR',
    ARRAY['Cardboard', 'PET Bottles', 'Mixed Plastics', 'Aluminium Cans', 'Paper', 'Glass'],
    '08:00 - 18:00',
    '+91-9876543214',
    4.9,
    TRUE,
    '{"Cardboard": 14.00, "PET Bottles": 22.00, "Mixed Plastics": 18.00, "Aluminium Cans": 105.00, "Paper": 12.00, "Glass": 4.50}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_list = EXCLUDED.price_list;

-- 2. DEMO CITY CONFIGURATION
INSERT INTO public.city_configs (
    city_code,
    city_name,
    ward_name,
    bins,
    collection_schedule
) VALUES (
    'BLR',
    'Bengaluru (BBMP)',
    'Ward 151 (Koramangala)',
    '[{"id":"green","name":"Wet Waste","color":"#2E7D32","items":["Vegetable peels","Leftover food","Fruit skins","Tea bags","Egg shells"]},{"id":"blue","name":"Dry Waste","color":"#1565C0","items":["Plastic bottles","Paper","Cardboard","Metal cans","Milk pouches"]},{"id":"red","name":"Sanitary / Hazard","color":"#C62828","items":["Sanitary pads","Diapers","Bandages","Syringes","Expired medicines"]}]'::jsonb,
    '[{"time":"07:00 - 08:30","category":"Wet Waste","days":["Everyday"]},{"time":"09:00 - 10:30","category":"Dry Waste","days":["Tue","Fri"]},{"time":"11:00 - 12:00","category":"Hazardous","days":["Sun"]}]'::jsonb
) ON CONFLICT (city_code) DO NOTHING;
