import os
import sys
import logging

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import AdminUser
from app.services.auth_service import AuthService
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_admin():
    """Seed the initial admin user securely from environment variables."""
    load_dotenv()
    
    username = os.getenv("INITIAL_ADMIN_USERNAME", "admin")
    password = os.getenv("INITIAL_ADMIN_PASSWORD")
    
    if not password or password == "change_this_before_deploying":
        logger.error("CRITICAL: Refusing to seed database. You must set a strong INITIAL_ADMIN_PASSWORD in your .env file.")
        sys.exit(1)
        
    db = SessionLocal()
    try:
        if db.query(AdminUser).filter_by(username=username).first():
            logger.info(f"Admin user '{username}' already exists. Skipping seed.")
            return
            
        logger.info(f"Creating highly-secure admin user '{username}'...")
        hashed_pw = AuthService.get_password_hash(password)
        admin = AdminUser(username=username, password_hash=hashed_pw)
        db.add(admin)
        db.commit()
        logger.info(f"✅ Admin user '{username}' seeded successfully!")
    except Exception as e:
        logger.error(f"Failed to seed admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
