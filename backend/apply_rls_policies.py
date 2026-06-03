import os
import psycopg2
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def apply_rls_policies():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        print("Connected to Supabase PostgreSQL for RLS configuration.")

        # Tables list to configure
        tables = [
            'profiles_just', 'lawyers_just', 'documents_just', 'appointments_just',
            'ai_conversations_just', 'payments_just', 'assistance_tickets_just', 'quotes_just',
            'chat_rooms_just', 'chat_messages_just', 'complaints_just', 'legal_news_just',
            'services_just', 'formations_just', 'outils_just', 'platform_settings_just',
            'search_history_just', 'contact_messages_just'
        ]

        # Set gen_random_uuid() as default for ID column on duplicated tables
        print("Setting default gen_random_uuid() on id columns...")
        uuid_tables = [
            'documents_just', 'appointments_just', 'ai_conversations_just', 'payments_just',
            'assistance_tickets_just', 'quotes_just', 'chat_rooms_just', 'chat_messages_just',
            'complaints_just', 'legal_news_just', 'services_just', 'formations_just',
            'outils_just', 'search_history_just', 'contact_messages_just'
        ]
        for t in uuid_tables:
            try:
                cur.execute(f"ALTER TABLE public.{t} ALTER COLUMN id SET DEFAULT gen_random_uuid();")
            except Exception as e:
                print(f"Could not set default UUID for {t}: {e}")
                conn.rollback()
        conn.commit()

        # Enable RLS on all tables
        print("Enabling RLS on all _just tables...")
        for table in tables:
            cur.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")
            
            # Drop all existing policies on this table
            cur.execute(f"""
                DO $$
                DECLARE
                    pol record;
                BEGIN
                    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = '{table}'
                    LOOP
                        EXECUTE format('DROP POLICY IF EXISTS %I ON public.{table}', pol.policyname);
                    END LOOP;
                END $$;
            """)
        conn.commit()

        # Define policies to apply
        policies = [
            # 1. profiles_just
            ('profiles_just', 'Public read profiles just', 'FOR SELECT USING (true)'),
            ('profiles_just', 'Users insert own profile just', 'FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin())'),
            ('profiles_just', 'Users and Admins update profiles just', 'FOR UPDATE USING (auth.uid() = id OR public.is_admin())'),
            ('profiles_just', 'Admins delete profiles just', 'FOR DELETE USING (public.is_admin())'),

            # 2. lawyers_just
            ('lawyers_just', 'Public can see lawyers just', 'FOR SELECT USING (true)'),
            ('lawyers_just', 'Lawyers insert own info just', 'FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin())'),
            ('lawyers_just', 'Lawyers update own info just', 'FOR UPDATE USING (auth.uid() = id OR public.is_admin())'),
            ('lawyers_just', 'Admins delete lawyers just', 'FOR DELETE USING (public.is_admin())'),

            # 3. documents_just
            ('documents_just', 'Users can see own documents just', 'FOR SELECT USING (auth.uid() = owner_id OR public.is_admin())'),
            ('documents_just', 'Users can insert own documents just', 'FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin())'),
            ('documents_just', 'Users can update own documents just', 'FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin())'),
            ('documents_just', 'Users can delete own documents just', 'FOR DELETE USING (auth.uid() = owner_id OR public.is_admin())'),

            # 4. appointments_just
            ('appointments_just', 'Users can see their appointments just', 'FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),
            ('appointments_just', 'Users can insert their appointments just', 'FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),
            ('appointments_just', 'Users can update their appointments just', 'FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),
            ('appointments_just', 'Users can delete their appointments just', 'FOR DELETE USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),

            # 5. ai_conversations_just
            ('ai_conversations_just', 'Users can see their AI chats just', 'FOR SELECT USING (auth.uid() = user_id OR public.is_admin())'),
            ('ai_conversations_just', 'Users can insert their AI chats just', 'FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin())'),
            ('ai_conversations_just', 'Users can update their AI chats just', 'FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())'),
            ('ai_conversations_just', 'Users can delete their AI chats just', 'FOR DELETE USING (auth.uid() = user_id OR public.is_admin())'),

            # 6. payments_just
            ('payments_just', 'Users can view own payments just', 'FOR SELECT USING (auth.uid() = user_id OR public.is_admin())'),
            ('payments_just', 'Users can insert own payments just', 'FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin())'),
            ('payments_just', 'Admins update payments just', 'FOR UPDATE USING (public.is_admin())'),
            ('payments_just', 'Admins delete payments just', 'FOR DELETE USING (public.is_admin())'),

            # 7. assistance_tickets_just
            ('assistance_tickets_just', 'Users can view own tickets just', 'FOR SELECT USING (auth.uid() = user_id OR public.is_admin())'),
            ('assistance_tickets_just', 'Users can insert own tickets just', 'FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin())'),
            ('assistance_tickets_just', 'Users can update own tickets just', 'FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())'),
            ('assistance_tickets_just', 'Admins delete tickets just', 'FOR DELETE USING (public.is_admin())'),

            # 8. quotes_just
            ('quotes_just', 'Clients can see their own quotes just', 'FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),
            ('quotes_just', 'Lawyers can create quotes just', 'FOR INSERT WITH CHECK (auth.uid() = lawyer_id OR public.is_admin())'),
            ('quotes_just', 'Lawyers can update their own quotes just', 'FOR UPDATE USING (auth.uid() = lawyer_id OR public.is_admin())'),
            ('quotes_just', 'Admins delete quotes just', 'FOR DELETE USING (public.is_admin())'),

            # 9. chat_rooms_just
            ('chat_rooms_just', 'Users can see their own chat rooms just', 'FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),
            ('chat_rooms_just', 'Users can create their own chat rooms just', 'FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),
            ('chat_rooms_just', 'Users can update their own chat rooms just', 'FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin())'),

            # 10. chat_messages_just
            ('chat_messages_just', 'Users can see messages of their rooms just', 'FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_rooms_just r WHERE r.id = room_id AND (r.client_id = auth.uid() OR r.lawyer_id = auth.uid())) OR public.is_admin())'),
            ('chat_messages_just', 'Users can send messages to their rooms just', 'FOR INSERT WITH CHECK ((sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.chat_rooms_just r WHERE r.id = room_id AND (r.client_id = auth.uid() OR r.lawyer_id = auth.uid()))) OR public.is_admin())'),
            ('chat_messages_just', 'Users can update their own messages just', 'FOR UPDATE USING (sender_id = auth.uid() OR public.is_admin())'),
            ('chat_messages_just', 'Users can delete their own messages just', 'FOR DELETE USING (sender_id = auth.uid() OR public.is_admin())'),

            # 11. complaints_just
            ('complaints_just', 'Users can see own complaints just', 'FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin())'),
            ('complaints_just', 'Users can insert own complaints just', 'FOR INSERT WITH CHECK (auth.uid() = reporter_id OR public.is_admin())'),
            ('complaints_just', 'Users can update own complaints just', 'FOR UPDATE USING (auth.uid() = reporter_id OR public.is_admin())'),

            # 12. legal_news_just
            ('legal_news_just', 'Anyone can see legal news just', 'FOR SELECT USING (true)'),
            ('legal_news_just', 'Admins can manage news just', 'FOR ALL USING (public.is_admin())'),

            # 13. services_just
            ('services_just', 'Anyone can see services just', 'FOR SELECT USING (true)'),
            ('services_just', 'Admins can manage services just', 'FOR ALL USING (public.is_admin())'),

            # 14. formations_just
            ('formations_just', 'Anyone can see formations just', 'FOR SELECT USING (true)'),
            ('formations_just', 'Admins can manage formations just', 'FOR ALL USING (public.is_admin())'),

            # 15. outils_just
            ('outils_just', 'Anyone can see outils just', 'FOR SELECT USING (true)'),
            ('outils_just', 'Admins can manage outils just', 'FOR ALL USING (public.is_admin())'),

            # 16. platform_settings_just
            ('platform_settings_just', 'Anyone can see settings just', 'FOR SELECT USING (true)'),
            ('platform_settings_just', 'Admins can manage settings just', 'FOR ALL USING (public.is_admin())'),

            # 17. search_history_just
            ('search_history_just', 'Users can see their own search history just', 'FOR SELECT USING (auth.uid() = user_id OR public.is_admin())'),
            ('search_history_just', 'Users can insert their own search history just', 'FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin())'),
            ('search_history_just', 'Users can update their own search history just', 'FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())'),

            # 18. contact_messages_just
            ('contact_messages_just', 'Anyone can insert contact message just', 'FOR INSERT WITH CHECK (true)'),
            ('contact_messages_just', 'Admins can view contact messages just', 'FOR SELECT USING (public.is_admin())'),
            ('contact_messages_just', 'Admins can delete contact messages just', 'FOR DELETE USING (public.is_admin())'),
        ]

        print("Applying RLS policies to all _just tables...")
        for table, name, rule in policies:
            sql = f"CREATE POLICY {psycopg2.extensions.quote_ident(name, cur)} ON public.{table} {rule};"
            cur.execute(sql)
            
        conn.commit()
        print("Successfully applied all RLS policies on _just tables!")

        # Synchronize existing data from original tables to _just tables
        print("Synchronizing existing records from original tables to _just tables...")
        sync_tables = [
            'profiles', 'lawyers', 'legal_news', 'documents', 'appointments', 
            'ai_conversations', 'payments', 'contact_messages', 'search_history', 
            'services', 'formations', 'outils', 'assistance_tickets', 
            'platform_settings', 'quotes', 'chat_rooms', 'chat_messages', 'complaints'
        ]
        for t in sync_tables:
            try:
                # Find the primary key dynamically
                cur.execute(f"""
                    SELECT a.attname
                    FROM   pg_index i
                    JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                         AND a.attnum = ANY(i.indkey)
                    WHERE  i.indrelid = 'public.{t}'::regclass
                    AND    i.indisprimary;
                """)
                pk_rows = cur.fetchall()
                pk = pk_rows[0][0] if pk_rows else 'id'
                if t == 'platform_settings':
                    pk = 'id'
                
                cur.execute(f"""
                    INSERT INTO public.{t}_just 
                    SELECT * FROM public.{t} 
                    ON CONFLICT ({pk}) DO NOTHING;
                """)
                print(f"Synchronized table {t} -> {t}_just")
            except Exception as e:
                print(f"Could not synchronize table {t}: {e}")
                conn.rollback()
        conn.commit()

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error applying RLS policies: {e}")

if __name__ == "__main__":
    apply_rls_policies()
