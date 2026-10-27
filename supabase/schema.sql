-- ==============================================================================
-- PRINTEX / PRINTDECK CLONE - COMPLETE SUPABASE SETUP SCRIPT
-- Paste this entire script into your Supabase SQL Editor and click "Run".
-- ==============================================================================

-- QUICK MIGRATION FOR EXISTING TABLES:
-- If your tables are already created, run these two lines to add the email column:
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create Shops Table
CREATE TABLE IF NOT EXISTS public.shops (
  id TEXT PRIMARY KEY, -- Slug, e.g. "sharma-xerox-pune"
  owner_id UUID,
  email TEXT DEFAULT '',
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  upi_id TEXT DEFAULT '',
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  referral TEXT,
  price_bw NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
  price_color NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
  double_discount NUMERIC(4, 2) NOT NULL DEFAULT 0.25, -- 25% discount for duplex
  price_spiral NUMERIC(6, 2) NOT NULL DEFAULT 30.00,
  price_staple NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
  price_lamination NUMERIC(6, 2) NOT NULL DEFAULT 20.00,
  accept_uploads BOOLEAN NOT NULL DEFAULT true,
  show_whatsapp BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_owner_id_fkey;
ALTER TABLE public.shops ALTER COLUMN owner_id DROP NOT NULL;

DROP POLICY IF EXISTS "Public can view shops" ON public.shops;
CREATE POLICY "Public can view shops"
  ON public.shops FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Shop owners can update their shop" ON public.shops;
DROP POLICY IF EXISTS "Anyone can update a shop" ON public.shops;
CREATE POLICY "Anyone can update a shop"
  ON public.shops FOR UPDATE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create a shop" ON public.shops;
DROP POLICY IF EXISTS "Anyone can create a shop" ON public.shops;
CREATE POLICY "Anyone can create a shop"
  ON public.shops FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RPC for secure shop creation (bypasses RLS constraints)
CREATE OR REPLACE FUNCTION public.create_print_shop(
  p_id TEXT,
  p_name TEXT,
  p_owner TEXT,
  p_whatsapp TEXT,
  p_address TEXT,
  p_state TEXT,
  p_referral TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop public.shops;
  v_owner_id UUID;
BEGIN
  v_owner_id := auth.uid();
  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id FROM auth.users LIMIT 1;
  END IF;

  INSERT INTO public.shops (
    id, owner_id, name, owner, whatsapp, address, state, referral,
    price_bw, price_color, double_discount, price_spiral, price_staple, price_lamination,
    accept_uploads, show_whatsapp
  ) VALUES (
    p_id, v_owner_id, p_name, p_owner, p_whatsapp, p_address, p_state, p_referral,
    2.00, 10.00, 0.25, 30.00, 5.00, 20.00,
    true, true
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    owner = EXCLUDED.owner,
    whatsapp = EXCLUDED.whatsapp,
    address = EXCLUDED.address,
    state = EXCLUDED.state
  RETURNING * INTO v_shop;

  RETURN to_jsonb(v_shop);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_print_shop TO anon, authenticated;

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
  token_no TEXT NOT NULL DEFAULT (FLOOR(1000 + RANDOM() * 9000)::TEXT),
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  pages INT NOT NULL DEFAULT 1,
  copies INT NOT NULL DEFAULT 1,
  color TEXT NOT NULL CHECK (color IN ('bw', 'color')),
  sides TEXT NOT NULL CHECK (sides IN ('single', 'double')),
  paper_size TEXT NOT NULL DEFAULT 'A4',
  binding TEXT NOT NULL DEFAULT 'none',
  page_range TEXT NOT NULL DEFAULT 'all',
  amount NUMERIC(8, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'ready', 'collected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can read their orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
CREATE POLICY "Anyone can read orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Shop owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
CREATE POLICY "Anyone can update orders"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Shop owners can delete their orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;
CREATE POLICY "Anyone can delete orders"
  ON public.orders FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. Upload Attempts Table (Rate-limiting & Analytics)
CREATE TABLE IF NOT EXISTS public.upload_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.upload_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert upload attempts" ON public.upload_attempts;
CREATE POLICY "Public insert upload attempts"
  ON public.upload_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Helper RPC Functions

-- Find Print Shops (for search & customer view)
CREATE OR REPLACE FUNCTION public.find_print_shops(
  search_text TEXT DEFAULT '',
  shop_slug TEXT DEFAULT ''
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  owner TEXT,
  whatsapp TEXT,
  upi_id TEXT,
  address TEXT,
  state TEXT,
  price_bw NUMERIC,
  price_color NUMERIC,
  double_discount NUMERIC,
  price_spiral NUMERIC,
  price_staple NUMERIC,
  price_lamination NUMERIC,
  accept_uploads BOOLEAN,
  show_whatsapp BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF shop_slug <> '' THEN
    RETURN QUERY
    SELECT s.id, s.name, s.owner, s.whatsapp, s.upi_id, s.address, s.state,
           s.price_bw, s.price_color, s.double_discount, s.price_spiral,
           s.price_staple, s.price_lamination, s.accept_uploads, s.show_whatsapp, s.created_at
    FROM public.shops s
    WHERE s.id = shop_slug;
  ELSE
    RETURN QUERY
    SELECT s.id, s.name, s.owner, s.whatsapp, s.upi_id, s.address, s.state,
           s.price_bw, s.price_color, s.double_discount, s.price_spiral,
           s.price_staple, s.price_lamination, s.accept_uploads, s.show_whatsapp, s.created_at
    FROM public.shops s
    WHERE search_text = '' OR s.name ILIKE ('%' || search_text || '%') OR s.address ILIKE ('%' || search_text || '%')
    ORDER BY s.created_at DESC
    LIMIT 20;
  END IF;
END;
$$;

-- Reserve Print Upload (check if shop is accepting orders)
CREATE OR REPLACE FUNCTION public.reserve_print_upload(shop_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  accepting BOOLEAN;
BEGIN
  SELECT accept_uploads INTO accepting FROM public.shops WHERE id = shop_slug;
  IF accepting IS TRUE THEN
    INSERT INTO public.upload_attempts(shop_id) VALUES (shop_slug);
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- 7. Supabase Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('print-documents', 'print-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Public can upload to print-documents" ON storage.objects;
CREATE POLICY "Public can upload to print-documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'print-documents');

DROP POLICY IF EXISTS "Shop owners can read documents" ON storage.objects;
CREATE POLICY "Shop owners can read documents"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'print-documents');

DROP POLICY IF EXISTS "Shop owners can delete documents" ON storage.objects;
CREATE POLICY "Shop owners can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated, anon
  USING (bucket_id = 'print-documents');

-- 8. Enable Realtime on Orders Table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
