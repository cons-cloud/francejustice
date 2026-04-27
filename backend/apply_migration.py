import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def apply_sql():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        with open('quotes_schema.sql', 'r') as f:
            sql = f.read()
            cur.execute(sql)
            conn.commit()
            print("Successfully applied quotes_schema.sql")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply_sql()
