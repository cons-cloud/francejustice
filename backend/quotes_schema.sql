-- SCHEMA FOR QUOTES (DEVIS) & COMMISSIONS
-- Run this in Supabase SQL Editor

-- 1. Create Quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    lawyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL, -- 20%
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, paid, commissioned
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME_ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update Payments table (if needed, but it seems generic enough)
-- Just adding an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(type);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

-- 3. Real-time configuration
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quotes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
    END IF;
END $$;

-- 4. RLS POLICIES
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Clients can see their own quotes
CREATE POLICY "Clients can see their own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = client_id);

-- Lawyers can see and manage their own quotes
CREATE POLICY "Lawyers can see their own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = lawyer_id);

CREATE POLICY "Lawyers can create quotes" ON public.quotes
    FOR INSERT WITH CHECK (auth.uid() = lawyer_id);

CREATE POLICY "Lawyers can update their own quotes" ON public.quotes
    FOR UPDATE USING (auth.uid() = lawyer_id);

-- Admins full access
CREATE POLICY "Admins full access on quotes" ON public.quotes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
