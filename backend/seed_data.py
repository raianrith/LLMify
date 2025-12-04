"""Seed script to create initial data for development/demo."""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, init_db
from app.auth import get_password_hash
from app import models


def seed_database():
    """Create initial clients, users, competitors, and predefined queries."""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing_client = db.query(models.Client).first()
        if existing_client:
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding database...")
        
        # ─── CREATE CLIENTS ───────────────────────────────────────────────────
        
        # Kaysun
        kaysun = models.Client(
            name="Kaysun Corporation",
            slug="kaysun",
            brand_name="Kaysun",
            industry="Custom Injection Molding",
            description="Custom injection molding experts for medical, automotive, and industrial applications",
            primary_color="#e64626",
            default_openai_model="gpt-4o",
            default_gemini_model="gemini-2.0-flash-exp",
            default_perplexity_model="sonar"
        )
        db.add(kaysun)
        
        # Weidert Group
        weidert = models.Client(
            name="Weidert Group",
            slug="weidert",
            brand_name="Weidert Group",
            industry="B2B Marketing Agency",
            description="B2B inbound marketing and sales enablement agency",
            primary_color="#0066cc",
            default_openai_model="gpt-4o",
            default_gemini_model="gemini-2.0-flash-exp",
            default_perplexity_model="sonar"
        )
        db.add(weidert)
        
        db.commit()
        db.refresh(kaysun)
        db.refresh(weidert)
        
        print(f"Created clients: Kaysun (ID: {kaysun.id}), Weidert (ID: {weidert.id})")
        
        # ─── CREATE USERS ─────────────────────────────────────────────────────
        
        # Superadmin
        superadmin = models.User(
            email="admin@llmvisibility.com",
            username="superadmin",
            full_name="Super Admin",
            hashed_password=get_password_hash("admin123"),
            client_id=kaysun.id,
            is_admin=True,
            is_superadmin=True
        )
        db.add(superadmin)
        
        # Kaysun admin
        kaysun_admin = models.User(
            email="admin@kaysun.com",
            username="kaysun_admin",
            full_name="Kaysun Admin",
            hashed_password=get_password_hash("kaysun123"),
            client_id=kaysun.id,
            is_admin=True
        )
        db.add(kaysun_admin)
        
        # Kaysun user
        kaysun_user = models.User(
            email="user@kaysun.com",
            username="kaysun_user",
            full_name="Kaysun User",
            hashed_password=get_password_hash("kaysun123"),
            client_id=kaysun.id,
            is_admin=False
        )
        db.add(kaysun_user)
        
        # Weidert admin
        weidert_admin = models.User(
            email="admin@weidert.com",
            username="weidert_admin",
            full_name="Weidert Admin",
            hashed_password=get_password_hash("weidert123"),
            client_id=weidert.id,
            is_admin=True
        )
        db.add(weidert_admin)
        
        db.commit()
        print("Created users: superadmin, kaysun_admin, kaysun_user, weidert_admin")
        
        # ─── CREATE COMPETITORS FOR KAYSUN ────────────────────────────────────
        
        kaysun_competitors = [
            ("Crescent Industries", "https://www.crescentind.com"),
            ("PTI Engineered Plastics", "https://www.teampti.com"),
            ("PTI Plastics", "https://www.teampti.com"),
            ("Rosti", "https://www.rfrosti.com"),
            ("EVCO Plastics", "https://www.evcoplastics.com"),
            ("Rodon Group", "https://www.rodongroup.com"),
        ]
        
        for name, website in kaysun_competitors:
            competitor = models.Competitor(
                name=name,
                website=website,
                client_id=kaysun.id
            )
            db.add(competitor)
        
        db.commit()
        print(f"Created {len(kaysun_competitors)} competitors for Kaysun")
        
        # ─── CREATE COMPETITORS FOR WEIDERT ───────────────────────────────────
        
        weidert_competitors = [
            ("SmartBug Media", "https://www.smartbugmedia.com"),
            ("New Breed", "https://www.newbreedrevenue.com"),
            ("IMPACT", "https://www.impactplus.com"),
            ("Square 2", "https://www.square2marketing.com"),
        ]
        
        for name, website in weidert_competitors:
            competitor = models.Competitor(
                name=name,
                website=website,
                client_id=weidert.id
            )
            db.add(competitor)
        
        db.commit()
        print(f"Created {len(weidert_competitors)} competitors for Weidert")
        
        # ─── CREATE PREDEFINED QUERIES FOR KAYSUN ─────────────────────────────
        
        kaysun_queries = [
            "Who is Kaysun Corporation and what do they specialize in?",
            "What services does Kaysun offer in custom injection molding?",
            "Is Kaysun a good supplier for tight tolerance medical device parts?",
            "Does Kaysun provide in-house tooling and mold design capabilities?",
            "How does Kaysun approach scientific molding?",
            "How does Kaysun approach validation requirements?",
            "Best custom injection molding companies in the U.S. for complex, regulated parts",
            "Kaysun vs PTI Plastics — which is better for medical molding?",
            "Top injection molders for tight-tolerance components",
            "Which suppliers excel at scientific molding?",
            "Which injection molders excel at IQ/OQ/PQ validation?",
            "Leading U.S. injection molders with cleanroom molding capabilities",
            "Best suppliers for DFM support in plastic injection molding",
            "Top injection molding companies with in-house tooling and engineering support",
            "How much does tight-tolerance injection molding cost for medical applications?",
            "What should be included in an RFQ for custom injection molding?",
            "Who are the top medical injection molding suppliers for high-volume programs?",
            "Which injection molders offer end-to-end tooling, molding, and secondary assembly?",
            "What certifications should an injection molding supplier have for FDA-regulated parts?",
            "Where can I source a U.S. injection molder for replacing an underperforming supplier?",
        ]
        
        for idx, query in enumerate(kaysun_queries):
            pq = models.PredefinedQuery(
                client_id=kaysun.id,
                query_text=query,
                category="General",
                order_index=idx
            )
            db.add(pq)
        
        db.commit()
        print(f"Created {len(kaysun_queries)} predefined queries for Kaysun")
        
        # ─── CREATE PREDEFINED QUERIES FOR WEIDERT ────────────────────────────
        
        weidert_queries = [
            "Who is Weidert Group and what do they specialize in?",
            "Best B2B marketing agencies in the Midwest",
            "Top HubSpot partner agencies for manufacturing companies",
            "B2B inbound marketing agencies for industrial companies",
            "Weidert Group vs SmartBug Media - which is better?",
            "Marketing agencies that specialize in complex B2B sales",
            "Best content marketing agencies for industrial B2B",
            "HubSpot implementation partners for mid-market companies",
            "B2B marketing agencies with proven ROI results",
            "Marketing agencies for companies with long sales cycles",
        ]
        
        for idx, query in enumerate(weidert_queries):
            pq = models.PredefinedQuery(
                client_id=weidert.id,
                query_text=query,
                category="General",
                order_index=idx
            )
            db.add(pq)
        
        db.commit()
        print(f"Created {len(weidert_queries)} predefined queries for Weidert")
        
        print("\n✅ Database seeded successfully!")
        print("\n📝 Login credentials:")
        print("   Superadmin: superadmin / admin123")
        print("   Kaysun Admin: kaysun_admin / kaysun123")
        print("   Kaysun User: kaysun_user / kaysun123")
        print("   Weidert Admin: weidert_admin / weidert123")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

