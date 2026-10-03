import os
import psycopg2
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def apply_hardening():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL not found in backend/.env")
        return

    sql_path = os.path.join(os.path.dirname(__file__), '..', 'supabase_security_hardening.sql')
    if not os.path.exists(sql_path):
        print(f"❌ SQL file not found: {sql_path}")
        return

    with open(sql_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    try:
        print("🔗 Connecting to Supabase PostgreSQL...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        print("🛡️ Applying supabase_security_hardening.sql...")
        cur.execute(sql)
        print("✅ Supabase Security Hardening successfully applied!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error applying security hardening: {e}")

if __name__ == '__main__':
    apply_hardening()
