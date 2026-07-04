-- Create Classrooms Tables
CREATE TABLE IF NOT EXISTS public.classrooms_just (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL, -- 'direct', 'differe', 'video'
  video_url text,
  meeting_link text,
  lawyer_id uuid REFERENCES public.profiles_just(id) ON DELETE CASCADE NOT NULL,
  scheduled_at timestamp with time zone,
  duration_minutes int DEFAULT 60,
  max_members int DEFAULT 100,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classroom_registrations_just (
  classroom_id uuid REFERENCES public.classrooms_just(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles_just(id) ON DELETE CASCADE,
  registered_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (classroom_id, user_id)
);

-- Enable RLS
ALTER TABLE public.classrooms_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_registrations_just ENABLE ROW LEVEL SECURITY;

-- Classrooms Policies
DROP POLICY IF EXISTS "Public select classrooms_just" ON public.classrooms_just;
CREATE POLICY "Public select classrooms_just" ON public.classrooms_just
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lawyers manage classrooms_just" ON public.classrooms_just;
CREATE POLICY "Lawyers manage classrooms_just" ON public.classrooms_just
  FOR ALL USING (
    auth.uid() = lawyer_id OR 
    (EXISTS (SELECT 1 FROM public.profiles_just WHERE id = auth.uid() AND role = 'admin'))
  );

-- Registrations Policies
DROP POLICY IF EXISTS "Users view own registrations" ON public.classroom_registrations_just;
CREATE POLICY "Users view own registrations" ON public.classroom_registrations_just
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT lawyer_id FROM public.classrooms_just WHERE id = classroom_id) OR
    (EXISTS (SELECT 1 FROM public.profiles_just WHERE id = auth.uid() AND role = 'admin'))
  );

DROP POLICY IF EXISTS "Users insert own registrations" ON public.classroom_registrations_just;
CREATE POLICY "Users insert own registrations" ON public.classroom_registrations_just
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own registrations" ON public.classroom_registrations_just;
CREATE POLICY "Users delete own registrations" ON public.classroom_registrations_just
  FOR DELETE USING (auth.uid() = user_id);

-- Publication for Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.classrooms_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_registrations_just;
