"""
migrate_add_map_link.py — Adds venue_map_link column to bookings table if not present
"""
import sqlite3

conn = sqlite3.connect('yakshaai.db')
c = conn.cursor()

# Check if column exists
cols = [row[1] for row in c.execute("PRAGMA table_info(bookings)").fetchall()]
if 'venue_map_link' not in cols:
    c.execute("ALTER TABLE bookings ADD COLUMN venue_map_link TEXT")
    conn.commit()
    print("Added venue_map_link column to bookings table.")
else:
    print("venue_map_link already exists.")

conn.close()
