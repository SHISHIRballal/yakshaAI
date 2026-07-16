"""
verify_all.py — Quick verification of all 4 features
"""
import urllib.request, json, sqlite3

BASE = "http://127.0.0.1:8000"

def get(path):
    try:
        with urllib.request.urlopen(BASE + path, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

print("=" * 55)
print("FEATURE VERIFICATION")
print("=" * 55)

# 1. Real ratings reset
conn = sqlite3.connect("yakshaai.db")
c = conn.cursor()
rows = c.execute("SELECT id, avg_rating, total_reviews FROM artist_profiles").fetchall()
fake = [r for r in rows if r[1] > 0]
print(f"\n[1] Fake Ratings Cleared: {len(fake) == 0} — {len(rows)} artists, all at 0.0")

# 2. venue_map_link column exists in bookings
cols = [r[1] for r in c.execute("PRAGMA table_info(bookings)").fetchall()]
print(f"[2] venue_map_link in DB: {'venue_map_link' in cols}")

# 3. Availability table has rows (artist-set unavailable dates)
avail_rows = c.execute("SELECT COUNT(*) FROM availability WHERE is_available=0").fetchone()[0]
print(f"[3] Unavailable dates in DB: {avail_rows} (0 = no dates set yet by artists)")

# 4. Reviews table
review_rows = c.execute("SELECT COUNT(*) FROM reviews").fetchone()[0]
print(f"[4] Real reviews in DB: {review_rows}")

conn.close()

# 5. API check
health = get("/health")
print(f"\n[5] Backend health: {health.get('status', 'ERROR')}")

artists = get("/artists?limit=3&is_verified=true")
if isinstance(artists, list) and len(artists) > 0:
    a = artists[0]
    print(f"[6] Artists API OK: {a['user_name']} | rating={a['avg_rating']} | reviews={a['total_reviews']}")
else:
    print(f"[6] Artists API: {artists}")

avail = get(f"/artists/1/availability")
if isinstance(avail, list):
    print(f"[7] Artist #1 availability endpoint: OK ({len(avail)} entries)")
else:
    print(f"[7] Availability API: {avail}")

print("\n" + "=" * 55)
print("All checks done. Open http://localhost:5173")
print("=" * 55)
