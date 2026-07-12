"""
Add signature column to approval_requests table
Run: python add_approval_signature.py
"""
from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text(
            "ALTER TABLE approval_requests ADD COLUMN signature VARCHAR(200)"
        ))
        db.session.commit()
        print("✅ Added signature column to approval_requests")
    except Exception as e:
        if 'already exists' in str(e).lower():
            print("⏭️  Column already exists")
        else:
            print(f"❌ Error: {e}")