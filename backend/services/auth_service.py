import random
import jwt
import os
from datetime import datetime, timedelta
from flask import current_app

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
        """Send 2FA code via Gmail using yagmail"""
        try:
            import yagmail
            
            gmail_user = os.environ.get('MAIL_USERNAME')
            gmail_pass = os.environ.get('MAIL_PASSWORD')
            
            if not gmail_user or not gmail_pass:
                print(f"⚠️ Email not configured. Code for {email}: {code}")
                return True
            
            html = f"""
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
                <div style="background:#0A2A66;padding:25px;text-align:center;">
                    <div style="font-size:32px;">🎓</div>
                    <h1 style="color:#fff;font-size:18px;margin:10px 0 0;">MILTON MARGAI TECHNICAL UNIVERSITY</h1>
                    <p style="color:#FFC107;font-size:12px;margin:4px 0 0;">Examinations Office</p>
                </div>
                <div style="padding:25px;background:#fff;">
                    <h2 style="color:#0A2A66;text-align:center;margin:0 0 12px;">Two-Factor Authentication</h2>
                    <p style="color:#64748b;text-align:center;font-size:14px;">Use this code to complete your login. Expires in 2 minutes.</p>
                    <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                        <p style="color:#94a3b8;font-size:10px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Verification Code</p>
                        <p style="font-size:36px;font-weight:900;color:#0A2A66;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">{code}</p>
                    </div>
                    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;margin:16px 0;">
                        <p style="color:#92400e;font-size:11px;margin:0;">⚠️ Do not share this code with anyone. MMTU will never ask for it.</p>
                    </div>
                    <p style="color:#94a3b8;font-size:11px;text-align:center;">Sent to: {email}</p>
                </div>
                <div style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="color:#94a3b8;font-size:10px;margin:0;">MMTU Goderich Campus, Freetown • Sierra Leone</p>
                </div>
            </div>
            """
            
            yag = yagmail.SMTP(gmail_user, gmail_pass)
            yag.send(
                to=email,
                subject='🔐 MMTU - Your Verification Code',
                contents=html
            )
            print(f"✅ 2FA code sent to {email}")
            return True
            
        except Exception as e:
            print(f"❌ Email failed: {e}")
            print(f"🔑 Code for {email}: {code}")
            return True
    
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
            return jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        except:
            return None
    
    @staticmethod
    def generate_jwt(payload):
        payload['exp'] = datetime.utcnow() + timedelta(days=30)
        payload['iat'] = datetime.utcnow()
        return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')