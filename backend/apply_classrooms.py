import os
import psycopg2
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

def apply_migration():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        print("Connected to Supabase PostgreSQL.")

        schema_path = os.path.join(os.path.dirname(__file__), 'classrooms_schema.sql')
        with open(schema_path, 'r') as f:
            sql = f.read()
            cur.execute(sql)
            conn.commit()
            print("Successfully applied classrooms_schema.sql!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error applying migration: {e}")

if __name__ == "__main__":
    apply_migration()
