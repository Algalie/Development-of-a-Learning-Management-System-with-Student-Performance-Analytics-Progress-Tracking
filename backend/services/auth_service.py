import random
import jwt
from datetime import datetime, timedelta
from flask import current_app

# In-memory 2FA storage (use Redis in production)
_2fa_store = {}
_temp_tokens = {}

class AuthService:
    
    @staticmethod
    def generate_2fa_code():
        return str(random.randint(1000, 9999))
    
    @staticmethod
    def store_2fa_code(email, code, user_type):
        _2fa_store[email] = {
            'code': code,
            'type': user_type,
            'expires': datetime.utcnow() + timedelta(minutes=2)
        }
    
    @staticmethod
    def verify_2fa_code(email, code):
        stored = _2fa_store.get(email)
        if not stored:
            return False
        if datetime.utcnow() > stored['expires']:
            del _2fa_store[email]
            return False
        if stored['code'] != code:
            return False
        del _2fa_store[email]
        return True
    
    @staticmethod
    def send_2fa_code(email, code):
        """Log 2FA code to console. Use email service in production."""
        print("\n" + "="*70)
        print("🔐  2FA VERIFICATION CODE")
        print(f"📧 Email: {email}")
        print(f"🔑 Code: {code}")
        print("="*70 + "\n")
    
    @staticmethod
    def create_temp_token(user_id, user_type):
        token = jwt.encode({
            'user_id': user_id,
            'type': user_type,
            'exp': datetime.utcnow() + timedelta(minutes=5)
        }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        return token
    
    @staticmethod
    def verify_temp_token(token):
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            return data
        except:
            return None
    
    @staticmethod
    def generate_jwt(payload):
        payload['exp'] = datetime.utcnow() + timedelta(days=30)
        payload['iat'] = datetime.utcnow()
        return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')