import sqlite3
conn = sqlite3.connect('yakshaai.db')
c = conn.cursor()
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Tables:", tables)
for t in tables:
    count = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {count} rows")
conn.close()
