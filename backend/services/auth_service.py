import random
import jwt
from datetime import datetime, timedelta
from flask import current_app
from flask_mail import Message
from extensions import mail

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
        """Send 2FA code via email with MMTU branded template"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
                <tr><td align="center">
                    <table width="100%" style="max-width:500px;background:#fff;border-radius:16px;overflow:hidden;">
                        <tr><td style="background:#0A2A66;padding:25px;text-align:center;">
                            <div style="font-size:32px;margin-bottom:10px;">🎓</div>
                            <h1 style="color:#fff;font-size:18px;margin:0;">MILTON MARGAI TECHNICAL UNIVERSITY</h1>
                            <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">Exams Management Portal</p>
                        </td></tr>
                        <tr><td style="background:#FFC107;height:4px;"></td></tr>
                        <tr><td style="padding:25px;">
                            <h2 style="color:#0A2A66;font-size:16px;text-align:center;">Two-Factor Authentication</h2>
                            <p style="color:#64748b;font-size:13px;text-align:center;">Use this code to complete your login. Expires in 2 minutes.</p>
                            <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                                <p style="color:#94a3b8;font-size:10px;margin:0 0 8px;">VERIFICATION CODE</p>
                                <p style="font-size:32px;font-weight:900;color:#0A2A66;letter-spacing:10px;margin:0;font-family:'Courier New',monospace;">{code}</p>
                            </div>
                            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;margin:16px 0;">
                                <p style="color:#92400e;font-size:11px;margin:0;">⚠️ Do not share this code. MMTU will never ask for it.</p>
                            </div>
                            <p style="color:#94a3b8;font-size:11px;text-align:center;">Sent to: {email}</p>
                        </td></tr>
                        <tr><td style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e2e8f0;">
                            <p style="color:#94a3b8;font-size:10px;margin:0;">MMTU Goderich Campus, Freetown • Sierra Leone</p>
                        </td></tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>
        """
        
        try:
            msg = Message(
                subject='🔐 MMTU - Your Verification Code',
                recipients=[email],
                html=html
            )
            mail.send(msg)
            print(f"✅ 2FA code sent to {email}")
            return True
        except Exception as e:
            print(f"❌ Email failed: {e}")
            print(f"🔑 Code for {email}: {code}")
            return False
    
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