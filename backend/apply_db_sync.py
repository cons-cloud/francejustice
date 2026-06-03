import os
import psycopg2
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def apply_full_sync():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        print("Connected to Supabase PostgreSQL.")

        # 1. Run master_sync_db.sql
        print("Applying master_sync_db.sql...")
        with open(os.path.join(os.path.dirname(__file__), 'master_sync_db.sql'), 'r') as f:
            sql = f.read()
            cur.execute(sql)
            conn.commit()
            print("Successfully applied master_sync_db.sql")

        # 2. Run duplicate_schema_v2.sql with manual fixes for primary keys and duplication
        print("Applying duplication of schemas...")
        duplication_sql = """
        -- 1. DUPLICATION DES TABLES
        DO $$ 
        DECLARE
            table_name_rec record;
        BEGIN
            FOR table_name_rec IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
                                   AND tablename NOT LIKE '%_just'
                                   AND tablename IN ('documents', 'appointments', 'legal_news', 'services', 'ai_conversations', 
                                                  'payments', 'profiles', 'lawyers', 'contact_messages', 'search_history',
                                                  'formations', 'outils', 'assistance_tickets', 'platform_settings', 
                                                  'quotes', 'chat_rooms', 'chat_messages', 'complaints'))
            LOOP
                BEGIN
                    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I_just AS SELECT * FROM public.%I', table_name_rec.tablename, table_name_rec.tablename);
                EXCEPTION WHEN others THEN
                    -- Ignore si déjà existant
                END;
            END LOOP;
        END $$;

        -- 2. AJOUT DES PK (Pour les nouvelles tables détectées, avec sécurité IF NOT EXISTS)
        DO $$ 
        BEGIN
            -- primary keys checks
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'formations_just_pkey') THEN
                ALTER TABLE public.formations_just ADD PRIMARY KEY (id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'outils_just_pkey') THEN
                ALTER TABLE public.outils_just ADD PRIMARY KEY (id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assistance_tickets_just_pkey') THEN
                ALTER TABLE public.assistance_tickets_just ADD PRIMARY KEY (id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'platform_settings_just_pkey') THEN
                ALTER TABLE public.platform_settings_just ADD PRIMARY KEY (id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quotes_just_pkey') THEN
                ALTER TABLE public.quotes_just ADD PRIMARY KEY (id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chat_rooms_just_pkey') THEN
                ALTER TABLE public.chat_rooms_just ADD PRIMARY KEY (id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chat_messages_just_pkey') THEN
                ALTER TABLE public.chat_messages_just ADD PRIMARY KEY (id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'complaints_just_pkey') THEN
                ALTER TABLE public.complaints_just ADD PRIMARY KEY (id);
            END IF;
        EXCEPTION WHEN others THEN
            NULL;
        END $$;
        """
        cur.execute(duplication_sql)
        conn.commit()
        print("Successfully applied duplicate schemas.")

        # 3. Apply corrected Foreign Keys to resolve 400 Bad Request Joins
        print("Rebuilding foreign key constraints to fix PostgREST 400 errors...")
        fk_rebuild_sql = """
        -- Recreate relationships for profiles_just to lawyers_just
        ALTER TABLE public.lawyers_just DROP CONSTRAINT IF EXISTS lawyers_just_id_fkey CASCADE;
        ALTER TABLE public.lawyers_just ADD CONSTRAINT lawyers_just_id_fkey FOREIGN KEY (id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;

        -- Recreate relationships for appointments_just
        ALTER TABLE public.appointments_just DROP CONSTRAINT IF EXISTS appointments_just_client_id_fkey CASCADE;
        ALTER TABLE public.appointments_just DROP CONSTRAINT IF EXISTS appointments_just_lawyer_id_fkey CASCADE;
        ALTER TABLE public.appointments_just ADD CONSTRAINT appointments_just_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
        ALTER TABLE public.appointments_just ADD CONSTRAINT appointments_just_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;

        -- Recreate relationships for quotes_just
        ALTER TABLE public.quotes_just DROP CONSTRAINT IF EXISTS quotes_just_client_id_fkey CASCADE;
        ALTER TABLE public.quotes_just DROP CONSTRAINT IF EXISTS quotes_just_lawyer_id_fkey CASCADE;
        ALTER TABLE public.quotes_just DROP CONSTRAINT IF EXISTS quotes_just_case_id_fkey CASCADE;
        ALTER TABLE public.quotes_just ADD CONSTRAINT quotes_just_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
        ALTER TABLE public.quotes_just ADD CONSTRAINT quotes_just_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;

        -- Recreate relationships for chat_rooms_just
        ALTER TABLE public.chat_rooms_just DROP CONSTRAINT IF EXISTS chat_rooms_just_client_id_fkey CASCADE;
        ALTER TABLE public.chat_rooms_just DROP CONSTRAINT IF EXISTS chat_rooms_just_lawyer_id_fkey CASCADE;
        ALTER TABLE public.chat_rooms_just ADD CONSTRAINT chat_rooms_just_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
        ALTER TABLE public.chat_rooms_just ADD CONSTRAINT chat_rooms_just_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;

        -- Recreate relationships for chat_messages_just
        ALTER TABLE public.chat_messages_just DROP CONSTRAINT IF EXISTS chat_messages_just_room_id_fkey CASCADE;
        ALTER TABLE public.chat_messages_just DROP CONSTRAINT IF EXISTS chat_messages_just_sender_id_fkey CASCADE;
        ALTER TABLE public.chat_messages_just ADD CONSTRAINT chat_messages_just_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms_just(id) ON DELETE CASCADE;
        ALTER TABLE public.chat_messages_just ADD CONSTRAINT chat_messages_just_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles_just(id) ON DELETE SET NULL;

        -- Recreate relationships for assistance_tickets_just
        ALTER TABLE public.assistance_tickets_just DROP CONSTRAINT IF EXISTS assistance_tickets_just_user_id_fkey CASCADE;
        -- user_id in assistance_tickets links to profiles_just(id) for query select=*,profiles:user_id(...)
        ALTER TABLE public.assistance_tickets_just ADD CONSTRAINT assistance_tickets_just_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
        """
        cur.execute(fk_rebuild_sql)
        conn.commit()
        print("Successfully rebuilt all foreign keys! All 400 Bad Request errors should be resolved.")

        # 4. Enable Realtime on these tables
        realtime_sql = """
        -- Ensure publication has the tables
        DO $$ 
        DECLARE
            tab text;
        BEGIN
            FOR tab IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%_just'
            LOOP
                BEGIN
                    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tab);
                    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tab);
                EXCEPTION WHEN others THEN
                    NULL;
                END;
            END LOOP;
        END $$;
        """
        cur.execute(realtime_sql)
        conn.commit()
        print("Successfully ensured all realtime subscriptions are configured.")

        cur.close()
        conn.close()
        print("Rebuild process complete.")
    except Exception as e:
        print(f"Error during database sync: {e}")

if __name__ == "__main__":
    apply_full_sync()
