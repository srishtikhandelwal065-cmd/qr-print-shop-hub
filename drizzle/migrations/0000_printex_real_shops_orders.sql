CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '' CHECK (length(display_name) <= 80),
 avatar_url text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE FUNCTION public.create_owner_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''),80));
 RETURN NEW;
END; $$;
CREATE TRIGGER create_owner_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_owner_profile();
CREATE TABLE public.shops (
 id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{1,60}$'),
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
 name text NOT NULL CHECK (length(name) BETWEEN 3 AND 80),
 owner text NOT NULL CHECK (length(owner) BETWEEN 2 AND 60),
 whatsapp text NOT NULL CHECK (whatsapp ~ '^[6-9][0-9]{9}$'),
 address text NOT NULL CHECK (length(address) BETWEEN 8 AND 200),
 state text NOT NULL CHECK (length(state) BETWEEN 1 AND 80),
 referral text CHECK (length(referral) <= 20),
 price_bw numeric NOT NULL DEFAULT 2 CHECK (price_bw BETWEEN 0 AND 10000),
 price_color numeric NOT NULL DEFAULT 10 CHECK (price_color BETWEEN 0 AND 10000),
 double_discount numeric NOT NULL DEFAULT 0.25 CHECK (double_discount BETWEEN 0 AND 0.9),
 accept_uploads boolean NOT NULL DEFAULT true,
 show_whatsapp boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY shops_read_own ON public.shops FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY shops_create_own ON public.shops FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY shops_update_own ON public.shops FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE FUNCTION public.find_print_shops(search_text text DEFAULT '', shop_slug text DEFAULT NULL) RETURNS TABLE (id text,name text,whatsapp text,address text,state text,price_bw numeric,price_color numeric,double_discount numeric,accept_uploads boolean,show_whatsapp boolean,created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT s.id,s.name,s.whatsapp,s.address,s.state,s.price_bw,s.price_color,s.double_discount,s.accept_uploads,s.show_whatsapp,s.created_at FROM public.shops s WHERE (shop_slug IS NULL OR s.id = shop_slug) AND (s.name ILIKE '%' || left(search_text,80) || '%' OR s.address ILIKE '%' || left(search_text,80) || '%') ORDER BY s.name LIMIT 100;
$$;
REVOKE ALL ON FUNCTION public.find_print_shops(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_print_shops(text,text) TO anon,authenticated,service_role;
CREATE TABLE public.orders (
 id text PRIMARY KEY DEFAULT ('ORD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 shop_id text NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
 customer text NOT NULL CHECK (length(customer) BETWEEN 2 AND 40),
 file_name text NOT NULL CHECK (length(file_name) BETWEEN 1 AND 200),
 storage_path text NOT NULL UNIQUE,
 pages integer NOT NULL CHECK (pages BETWEEN 1 AND 10000),
 copies integer NOT NULL CHECK (copies BETWEEN 1 AND 50),
 color text NOT NULL CHECK (color IN ('bw','color')),
 sides text NOT NULL CHECK (sides IN ('single','double')),
 amount numeric NOT NULL CHECK (amount >= 0),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','printing','ready','collected')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.orders TO authenticated;
GRANT UPDATE (status) ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_read_own ON public.orders FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.shops WHERE shops.id=shop_id AND owner_id=auth.uid()));
CREATE POLICY orders_update_own ON public.orders FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.shops WHERE shops.id=shop_id AND owner_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.shops WHERE shops.id=shop_id AND owner_id=auth.uid()));
CREATE POLICY orders_delete_own ON public.orders FOR DELETE TO authenticated USING (EXISTS(SELECT 1 FROM public.shops WHERE shops.id=shop_id AND owner_id=auth.uid()));
CREATE INDEX orders_shop_created ON public.orders(shop_id,created_at DESC);
CREATE TABLE public.upload_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),shop_id text NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.upload_attempts TO service_role;
ALTER TABLE public.upload_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX upload_attempts_shop_time ON public.upload_attempts(shop_id,created_at);
CREATE FUNCTION public.reserve_print_upload(shop_slug text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(shop_slug));
 IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id=shop_slug AND accept_uploads) THEN RETURN false; END IF;
 IF (SELECT count(*) FROM public.upload_attempts WHERE shop_id=shop_slug AND created_at > now()-interval '1 hour') >= 60 THEN RETURN false; END IF;
 INSERT INTO public.upload_attempts(shop_id) VALUES(shop_slug);
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_print_upload(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_print_upload(text) TO service_role;
CREATE POLICY documents_owner_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='print-documents' AND EXISTS (SELECT 1 FROM public.shops WHERE id=(storage.foldername(name))[1] AND owner_id=auth.uid()));
CREATE POLICY documents_owner_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id='print-documents' AND EXISTS (SELECT 1 FROM public.shops WHERE id=(storage.foldername(name))[1] AND owner_id=auth.uid()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
