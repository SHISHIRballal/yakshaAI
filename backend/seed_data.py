"""
YakshaAI Database Seeder
Populates the database with 20 realistic Yakshagana artist profiles.
Run: python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import ALL models first so SQLAlchemy can resolve all relationships
from app.models.user import User, UserRole
from app.models.artist import ArtistProfile, PerformanceStyle
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.availability import Availability  # Must be imported!

from app.database import SessionLocal, Base, engine
from app.utils.security import hash_password

Base.metadata.create_all(bind=engine)

ARTISTS = [
    {
        "name": "Balakrishna Shetty",
        "email": "balakrishna@yakshagai.com",
        "city": "Udupi",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Bhagavata",
        "experience": 22,
        "price": 25000,
        "bio": "Renowned Bhagavata with 22 years of experience in Badagu Tittu tradition. Known for his melodious voice and deep character portrayals.",
        "rating": 4.9,
        "reviews": 47,
        "bookings": 89,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Balakrishna&backgroundColor=b6e3f4",
        "event_types": "Temple Festivals,Cultural Programs,Private Events",
        "languages": "Kannada,Tulu",
    },
    {
        "name": "Sudhakar Rao Kunder",
        "email": "sudhakar@yakshagai.com",
        "city": "Mangaluru",
        "style": PerformanceStyle.tenkutittu,
        "specialization": "Veshadhara",
        "experience": 18,
        "price": 20000,
        "bio": "Master of Stri Vesha (female roles) in Tenkutittu tradition. His portrayal of Draupadi and Sita are legendary in coastal Karnataka.",
        "rating": 4.7,
        "reviews": 38,
        "bookings": 71,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Sudhakar&backgroundColor=ffd5dc",
        "event_types": "Temple Festivals,Cultural Programs,Wedding Ceremonies",
        "languages": "Kannada,Tulu,Konkani",
    },
    {
        "name": "Ganapathi Bhat",
        "email": "ganapathi@yakshagai.com",
        "city": "Kundapur",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Odeyata",
        "experience": 35,
        "price": 45000,
        "bio": "Legendary Odeyata performer with over 35 years in Yakshagana. Recipient of Karnataka Rajyotsava Award. Specialist in Kaurava and demon roles.",
        "rating": 5.0,
        "reviews": 92,
        "bookings": 180,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Ganapathi&backgroundColor=d1d4f9",
        "event_types": "Temple Festivals,National Competitions,Cultural Programs,Academy Shows",
        "languages": "Kannada,Sanskrit",
    },
    {
        "name": "Ravi Hegde",
        "email": "ravi.hegde@yakshagai.com",
        "city": "Dharwad",
        "style": PerformanceStyle.both,
        "specialization": "Chande",
        "experience": 14,
        "price": 15000,
        "bio": "Expert Chande player proficient in both Badagu and Tenkutittu styles. Trained under Guru Krishnamurthy Bhat. Available for full troupe performances.",
        "rating": 4.6,
        "reviews": 29,
        "bookings": 54,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Ravi&backgroundColor=c0aede",
        "event_types": "Temple Festivals,Cultural Programs,Workshops",
        "languages": "Kannada",
    },
    {
        "name": "Vikrama Naika",
        "email": "vikrama@yakshagai.com",
        "city": "Sirsi",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Bhagavata",
        "experience": 10,
        "price": 12000,
        "bio": "Young and dynamic Bhagavata from Uttara Kannada district. Specializes in contemporary Yakshagana narratives while preserving traditional forms.",
        "rating": 4.4,
        "reviews": 18,
        "bookings": 32,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Vikrama&backgroundColor=b6e3f4",
        "event_types": "Cultural Programs,College Events,Private Events",
        "languages": "Kannada,Hindi",
    },
    {
        "name": "Chandrashekhar Bhat",
        "email": "chandra@yakshagai.com",
        "city": "Udupi",
        "style": PerformanceStyle.tenkutittu,
        "specialization": "Veshadhara",
        "experience": 28,
        "price": 35000,
        "bio": "Senior artist of Tenkutittu who has performed across 15 countries. Known for his elaborate Kirita (crown) and intricate footwork in classical roles.",
        "rating": 4.8,
        "reviews": 63,
        "bookings": 120,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Chandrashekhar&backgroundColor=ffd5dc",
        "event_types": "International Festivals,Temple Festivals,Academy Shows",
        "languages": "Kannada,English,Tulu",
    },
    {
        "name": "Prabhakar Joshi",
        "email": "prabhakar@yakshagai.com",
        "city": "Bengaluru",
        "style": PerformanceStyle.both,
        "specialization": "Bhagavata",
        "experience": 8,
        "price": 18000,
        "bio": "Bengaluru-based versatile artist who bridges traditional and modern audiences. Has performed at Ramanavami, Krishnashtami and corporate cultural events.",
        "rating": 4.3,
        "reviews": 22,
        "bookings": 41,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Prabhakar&backgroundColor=d1d4f9",
        "event_types": "Corporate Events,Cultural Programs,Temple Festivals",
        "languages": "Kannada,English,Hindi",
    },
    {
        "name": "Narayana Acharya",
        "email": "narayana@yakshagai.com",
        "city": "Udupi",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Maddale",
        "experience": 20,
        "price": 18000,
        "bio": "Maestro of Maddale (drum) in Yakshagana. His rhythmic compositions are studied at Yakshagana academies. Offers group and solo percussion performances.",
        "rating": 4.7,
        "reviews": 41,
        "bookings": 76,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Narayana&backgroundColor=c0aede",
        "event_types": "Percussion Shows,Temple Festivals,Workshops,Academy Shows",
        "languages": "Kannada,Tulu",
    },
    {
        "name": "Shantharam Nayak",
        "email": "shantharam@yakshagai.com",
        "city": "Mangaluru",
        "style": PerformanceStyle.tenkutittu,
        "specialization": "Veshadhara",
        "experience": 12,
        "price": 14000,
        "bio": "Skilled in Raja Vesha (royal roles). Has performed in Yakshagana Bayalata (open air stage) for 12 years across coastal Karnataka.",
        "rating": 4.5,
        "reviews": 25,
        "bookings": 47,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Shantharam&backgroundColor=b6e3f4",
        "event_types": "Temple Festivals,Cultural Programs,Private Events",
        "languages": "Kannada,Tulu",
    },
    {
        "name": "Krishna Prasad Suvarna",
        "email": "krishna.suvarna@yakshagai.com",
        "city": "Karwar",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Bhagavata",
        "experience": 16,
        "price": 22000,
        "bio": "Award-winning Bhagavata from North Kannada coast. Known for his powerful voice and mastery over complex Sanskrit verses in Yakshagana scripts.",
        "rating": 4.6,
        "reviews": 34,
        "bookings": 63,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Krishna&backgroundColor=ffd5dc",
        "event_types": "Temple Festivals,Cultural Programs,Academy Shows",
        "languages": "Kannada,Sanskrit,Konkani",
    },
    {
        "name": "Ramachandra Gowda",
        "email": "ramachandra@yakshagai.com",
        "city": "Mysuru",
        "style": PerformanceStyle.both,
        "specialization": "Veshadhara",
        "experience": 6,
        "price": 9000,
        "bio": "Young artist from Mysuru trained at Yakshagana Kendra. Blends classical south Karnataka and coastal traditions for unique performances.",
        "rating": 4.2,
        "reviews": 12,
        "bookings": 22,
        "verified": False,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Ramachandra&backgroundColor=d1d4f9",
        "event_types": "Cultural Programs,College Events",
        "languages": "Kannada",
    },
    {
        "name": "Devaraja Hegde",
        "email": "devaraja@yakshagai.com",
        "city": "Honavar",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Chande",
        "experience": 24,
        "price": 28000,
        "bio": "Master percussionist with expertise in Chande. Has composed original rhythmic cycles (talas) for modern Yakshagana productions.",
        "rating": 4.8,
        "reviews": 52,
        "bookings": 98,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Devaraja&backgroundColor=c0aede",
        "event_types": "Temple Festivals,Percussion Shows,National Competitions",
        "languages": "Kannada,Havyaka",
    },
    {
        "name": "Manjunatha Raikar",
        "email": "manjunatha@yakshagai.com",
        "city": "Dharwad",
        "style": PerformanceStyle.tenkutittu,
        "specialization": "Bhagavata",
        "experience": 9,
        "price": 11000,
        "bio": "Rising star from Dharwad, trained under Yakshagana Bharati. Passionate about preserving ancient compositions while appealing to younger generations.",
        "rating": 4.3,
        "reviews": 15,
        "bookings": 28,
        "verified": False,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Manjunatha&backgroundColor=b6e3f4",
        "event_types": "Cultural Programs,College Events,Temple Festivals",
        "languages": "Kannada",
    },
    {
        "name": "Suresh Kumar Bhandary",
        "email": "suresh@yakshagai.com",
        "city": "Mangaluru",
        "style": PerformanceStyle.tenkutittu,
        "specialization": "Odeyata",
        "experience": 30,
        "price": 40000,
        "bio": "Senior Odeyata expert in Tenkutittu tradition. Has mentored over 200 students and performed at Yakshagana Mela in Karnataka Rajyotsava celebrations.",
        "rating": 4.9,
        "reviews": 78,
        "bookings": 145,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Suresh&backgroundColor=ffd5dc",
        "event_types": "Temple Festivals,National Competitions,Academy Shows,Training Workshops",
        "languages": "Kannada,Tulu,English",
    },
    {
        "name": "Anantha Padmanabha Bhat",
        "email": "anantha@yakshagai.com",
        "city": "Udupi",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Veshadhara",
        "experience": 40,
        "price": 50000,
        "bio": "Living legend of Yakshagana with 40 years on stage. Padma Shri nominee and recipient of 12 state and national awards. Expert in all Vesha categories.",
        "rating": 5.0,
        "reviews": 124,
        "bookings": 240,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Anantha&backgroundColor=d1d4f9",
        "event_types": "All Types",
        "languages": "Kannada,Sanskrit,Tulu,English",
    },
    {
        "name": "Gopalkrishna Varma",
        "email": "gopalkrishna@yakshagai.com",
        "city": "Kundapur",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Bhagavata",
        "experience": 15,
        "price": 17000,
        "bio": "Energetic Bhagavata known for his improvisational skills and ability to engage audiences of all ages. Specializes in Mahabharata episodes.",
        "rating": 4.5,
        "reviews": 32,
        "bookings": 58,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Gopalkrishna&backgroundColor=c0aede",
        "event_types": "Temple Festivals,Cultural Programs,Private Events",
        "languages": "Kannada,Tulu",
    },
    {
        "name": "Vasudeva Pai",
        "email": "vasudeva@yakshagai.com",
        "city": "Bengaluru",
        "style": PerformanceStyle.both,
        "specialization": "Veshadhara",
        "experience": 11,
        "price": 16000,
        "bio": "Diaspora artist based in Bengaluru who has performed for Kannadiga communities globally. Proficient in connecting traditional art with modern storytelling.",
        "rating": 4.4,
        "reviews": 20,
        "bookings": 38,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Vasudeva&backgroundColor=b6e3f4",
        "event_types": "Corporate Events,NRI Events,Cultural Programs",
        "languages": "Kannada,English,Hindi",
    },
    {
        "name": "Shivananda Acharya",
        "email": "shivananda@yakshagai.com",
        "city": "Udupi",
        "style": PerformanceStyle.tenkutittu,
        "specialization": "Maddale",
        "experience": 26,
        "price": 30000,
        "bio": "Expert Maddale player and teacher. Conducted workshops at Manipal Academy and international Yakshagana festivals in Malaysia and Singapore.",
        "rating": 4.8,
        "reviews": 56,
        "bookings": 104,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Shivananda&backgroundColor=ffd5dc",
        "event_types": "Percussion Shows,Temple Festivals,International Festivals,Workshops",
        "languages": "Kannada,Tulu,English",
    },
    {
        "name": "Harish Bolar",
        "email": "harish@yakshagai.com",
        "city": "Mangaluru",
        "style": PerformanceStyle.badagu_tittu,
        "specialization": "Bhagavata",
        "experience": 5,
        "price": 8000,
        "bio": "Young and passionate Bhagavata from Mangaluru. Graduate of Karnataka Yakshagana Academy. Fresh voice bringing contemporary energy to traditional performances.",
        "rating": 4.1,
        "reviews": 8,
        "bookings": 15,
        "verified": False,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Harish&backgroundColor=d1d4f9",
        "event_types": "Cultural Programs,College Events",
        "languages": "Kannada",
    },
    {
        "name": "Prakash Prabhu",
        "email": "prakash@yakshagai.com",
        "city": "Karwar",
        "style": PerformanceStyle.both,
        "specialization": "Veshadhara",
        "experience": 19,
        "price": 24000,
        "bio": "Versatile artist comfortable in both Badagu and Tenkutittu traditions. Known for elaborate costume management and disciplined stage presence.",
        "rating": 4.7,
        "reviews": 43,
        "bookings": 82,
        "verified": True,
        "photo": "https://api.dicebear.com/7.x/personas/svg?seed=Prakash&backgroundColor=c0aede",
        "event_types": "Temple Festivals,Cultural Programs,Academy Shows",
        "languages": "Kannada,Konkani,Tulu",
    },
]

SAMPLE_ORGANIZERS = [
    {"name": "Raghavendra Shetty", "email": "raghav.org@yakshagai.com"},
    {"name": "Meena Kulkarni", "email": "meena.org@yakshagai.com"},
    {"name": "Suresh Kamath", "email": "suresh.org@yakshagai.com"},
]


def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(User).filter(User.role == UserRole.artist).count()
        if existing > 0:
            print(f"⚠️  Database already has {existing} artists. Skipping seed.")
            return

        print("🌱 Seeding YakshaAI database...")

        # Create organizers
        organizer_users = []
        for org in SAMPLE_ORGANIZERS:
            user = User(
                name=org["name"],
                email=org["email"],
                password_hash=hash_password("Organizer@1234"),
                role=UserRole.organizer,
                phone="+91 98765 43210",
            )
            db.add(user)
            db.flush()
            organizer_users.append(user)
            print(f"  ✅ Organizer: {org['name']}")

        # Create artists
        artist_profiles = []
        for a in ARTISTS:
            user = User(
                name=a["name"],
                email=a["email"],
                password_hash=hash_password("Artist@1234"),
                role=UserRole.artist,
                phone="+91 94480 " + str(hash(a["name"]) % 90000 + 10000),
            )
            db.add(user)
            db.flush()

            profile = ArtistProfile(
                user_id=user.id,
                bio=a["bio"],
                performance_style=a["style"],
                specialization=a["specialization"],
                experience_years=a["experience"],
                city=a["city"],
                location=a["city"] + ", Karnataka",
                state="Karnataka",
                pricing_per_event=a["price"],
                is_verified=a["verified"],
                is_available=True,
                profile_photo_url=a["photo"],
                avg_rating=a["rating"],
                total_reviews=a["reviews"],
                total_bookings=a["bookings"],
                languages=a["languages"],
                event_types=a["event_types"],
            )
            db.add(profile)
            db.flush()
            artist_profiles.append(profile)
            print(f"  🎭 Artist: {a['name']} ({a['city']}) — {a['style'].value}")

        # Create some sample bookings
        import datetime
        sample_bookings_data = [
            {
                "organizer": organizer_users[0],
                "artist": artist_profiles[0],
                "event_date": "2026-07-15",
                "event_type": "Temple Festival",
                "venue": "Sri Krishna Temple, Udupi",
                "venue_city": "Udupi",
                "budget": 30000,
                "status": BookingStatus.confirmed,
            },
            {
                "organizer": organizer_users[1],
                "artist": artist_profiles[2],
                "event_date": "2026-08-02",
                "event_type": "Cultural Program",
                "venue": "Town Hall, Kundapur",
                "venue_city": "Kundapur",
                "budget": 50000,
                "status": BookingStatus.pending,
            },
            {
                "organizer": organizer_users[2],
                "artist": artist_profiles[4],
                "event_date": "2026-06-01",
                "event_type": "Wedding Ceremony",
                "venue": "Sirsi Palace Grounds",
                "venue_city": "Sirsi",
                "budget": 15000,
                "status": BookingStatus.completed,
            },
        ]

        bookings = []
        for bd in sample_bookings_data:
            booking = Booking(
                organizer_id=bd["organizer"].id,
                artist_id=bd["artist"].id,
                event_date=bd["event_date"],
                event_type=bd["event_type"],
                venue=bd["venue"],
                venue_city=bd["venue_city"],
                budget=bd["budget"],
                status=bd["status"],
                duration_hours=6,
            )
            db.add(booking)
            db.flush()
            bookings.append(booking)

        # Add review for completed booking
        completed_booking = bookings[2]
        review = Review(
            booking_id=completed_booking.id,
            organizer_id=organizer_users[2].id,
            artist_id=artist_profiles[4].id,
            rating=5.0,
            comment="Vikrama Naika was absolutely brilliant! The performance was mesmerizing and the guests were completely captivated. Highly recommend!",
        )
        db.add(review)

        db.commit()
        print(f"\n✨ Seeding complete!")
        print(f"   Artists created: {len(ARTISTS)}")
        print(f"   Organizers created: {len(SAMPLE_ORGANIZERS)}")
        print(f"   Sample bookings: {len(sample_bookings_data)}")
        print(f"\n🔑 Admin login: {os.environ.get('ADMIN_EMAIL', 'admin@yakshagai.com')} / Admin@1234")
        print(f"🔑 Artist login example: balakrishna@yakshagai.com / Artist@1234")
        print(f"🔑 Organizer login: raghav.org@yakshagai.com / Organizer@1234")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
