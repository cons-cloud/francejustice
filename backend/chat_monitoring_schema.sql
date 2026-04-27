-- CHAT & MONITORING SCHEMA
-- Run this in Supabase SQL Editor

-- 1. Chat Rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME_ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(lawyer_id, client_id)
);

-- 2. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME_ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Complaints (Plaintes)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, investigating, resolved
    created_at TIMESTAMP WITH TIME_ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Real-time
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.complaints REPLICA IDENTITY FULL;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_rooms') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'complaints') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
    END IF;
END $$;

-- 5. RLS POLICIES

-- Chat Rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own rooms" ON public.chat_rooms
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Chat Messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can see room messages" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = room_id AND (auth.uid() = client_id OR auth.uid() = lawyer_id))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Members can insert messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = room_id AND (auth.uid() = client_id OR auth.uid() = lawyer_id))
    );

-- Complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can report" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage complaints" ON public.complaints FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
