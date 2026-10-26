-- ==============================================================================
-- PRINTEX - INITIAL DEMO SEED & ACCOUNT ACTIVATION SCRIPT
-- Run this in your Supabase SQL Editor after running schema.sql
-- ==============================================================================

-- 1. Auto-confirm test user and all pending signups (bypasses email confirmation)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Insert Default Demo Shop linked to the first available owner
INSERT INTO public.shops (
  id, owner_id, name, owner, whatsapp, upi_id, address, state, 
  price_bw, price_color, double_discount, price_spiral, price_staple, price_lamination, 
  accept_uploads, show_whatsapp
) VALUES (
  'printex-test-hub',
  COALESCE(
    (SELECT id FROM auth.users WHERE email = 'printextest99@maxxspace.com' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
  ),
  'Printex Test Hub',
  'Test Owner',
  '9876543210',
  'printex@upi',
  '101 Connaught Place',
  'Delhi',
  2.00, 10.00, 0.25, 30.00, 5.00, 20.00,
  true, true
) ON CONFLICT (id) DO NOTHING;
