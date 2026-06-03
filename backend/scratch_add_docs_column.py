import os
import psycopg2
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def add_docs_column():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Add verification_documents to lawyers and lawyers_just
        print("Adding verification_documents column...")
        cur.execute("ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS verification_documents text[];")
        cur.execute("ALTER TABLE public.lawyers_just ADD COLUMN IF NOT EXISTS verification_documents text[];")
        conn.commit()
        print("Columns added successfully.")

        # 2. Create the storage bucket
        print("Creating storage bucket 'verification-docs'...")
        cur.execute("""
            INSERT INTO storage.buckets (id, name, public) 
            SELECT 'verification-docs', 'verification-docs', true
            WHERE NOT EXISTS (
                SELECT 1 FROM storage.buckets WHERE id = 'verification-docs'
            );
        """)
        conn.commit()
        
        # 3. Create storage policies
        print("Creating storage policies...")
        cur.execute("""
            DROP POLICY IF EXISTS "Public Verification Access" ON storage.objects;
            CREATE POLICY "Public Verification Access" ON storage.objects
            FOR SELECT USING ( bucket_id = 'verification-docs' );

            DROP POLICY IF EXISTS "Auth Verification Upload" ON storage.objects;
            CREATE POLICY "Auth Verification Upload" ON storage.objects
            FOR INSERT WITH CHECK ( bucket_id = 'verification-docs' );

            DROP POLICY IF EXISTS "Auth Verification Update" ON storage.objects;
            CREATE POLICY "Auth Verification Update" ON storage.objects
            FOR UPDATE USING ( bucket_id = 'verification-docs' );
        """)
        conn.commit()
        print("Storage bucket and policies configured successfully.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_docs_column()
