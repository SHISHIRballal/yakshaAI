"""
reset_ratings.py — Resets all artist avg_rating and total_reviews to 0
so only real submitted reviews count going forward.
"""
import sqlite3

conn = sqlite3.connect('yakshaai.db')
c = conn.cursor()

c.execute("UPDATE artist_profiles SET avg_rating = 0.0, total_reviews = 0")
conn.commit()

rows = c.execute("SELECT id, avg_rating, total_reviews FROM artist_profiles").fetchall()
for r in rows:
    print(f"Artist {r[0]}: rating={r[1]}, reviews={r[2]}")

print(f"\n✅ Reset {len(rows)} artist profiles — ratings cleared.")
conn.close()
