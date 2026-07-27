import random
import jwt
from datetime import datetime, timedelta
from flask import current_app, render_template
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
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            
            <!-- Outer Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:40px 0;">
                <tr>
                    <td align="center">
                        
                        <!-- Inner Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                            
                            <!-- Blue Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg, #0A2A66 0%, #1e40af 100%); padding:30px 30px 25px; text-align:center;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="text-align:center;">
                                                <div style="width:60px; height:60px; background:white; border-radius:16px; display:inline-block; padding:10px; margin-bottom:16px;">
                                                    <span style="font-size:32px; line-height:60px;">🎓</span>
                                                </div>
                                                <h1 style="color:#ffffff; font-size:22px; font-weight:700; margin:0 0 4px; letter-spacing:-0.3px;">
                                                    MILTON MARGAI TECHNICAL UNIVERSITY
                                                </h1>
                                                <p style="color:rgba(255,255,255,0.7); font-size:13px; margin:0; font-weight:500;">
                                                    Exams Management & GPA Grading Portal
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Yellow Bar -->
                            <tr>
                                <td style="background:#FFC107; height:4px;"></td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding:30px;">
                                    
                                    <!-- Lock Icon -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="text-align:center; padding-bottom:16px;">
                                                <div style="width:52px; height:52px; background:#eff6ff; border-radius:50%; display:inline-block; border:2px solid #bfdbfe;">
                                                    <span style="font-size:24px; line-height:52px;">🔐</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Title -->
                                    <h2 style="color:#0A2A66; font-size:18px; font-weight:700; text-align:center; margin:0 0 8px;">
                                        Two-Factor Authentication
                                    </h2>
                                    <p style="color:#64748b; font-size:14px; text-align:center; margin:0 0 28px; line-height:1.5;">
                                        Use the verification code below to complete your login. This code expires in <strong>2 minutes</strong>.
                                    </p>
                                    
                                    <!-- Code Box -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="text-align:center;">
                                                <table cellpadding="0" cellspacing="0" style="margin:0 auto; background:#f8fafc; border-radius:12px; border:2px dashed #e2e8f0; padding:20px 40px;">
                                                    <tr>
                                                        <td style="text-align:center;">
                                                            <p style="color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:2px; margin:0 0 8px;">
                                                                Verification Code
                                                            </p>
                                                            <p style="font-size:36px; font-weight:900; color:#0A2A66; letter-spacing:12px; margin:0; font-family:'Courier New', monospace;">
                                                                {code}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Warning -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                                        <tr>
                                            <td style="background:#fffbeb; border-radius:10px; padding:14px 16px; border:1px solid #fde68a;">
                                                <table cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="vertical-align:top; padding-right:10px;">
                                                            <span style="font-size:16px;">⚠️</span>
                                                        </td>
                                                        <td>
                                                            <p style="color:#92400e; font-size:12px; margin:0; line-height:1.5;">
                                                                <strong>Do not share this code with anyone.</strong> MMTU will never ask you to share your verification code.
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Divider -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                                        <tr>
                                            <td style="border-top:1px solid #e2e8f0;"></td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Footer Info -->
                                    <p style="color:#94a3b8; font-size:12px; text-align:center; margin:0 0 4px;">
                                        Sent to: <strong style="color:#64748b;">{email}</strong>
                                    </p>
                                    <p style="color:#94a3b8; font-size:12px; text-align:center; margin:0;">
                                        If you didn't request this code, please ignore this email.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background:#f8fafc; padding:20px 30px; text-align:center; border-top:1px solid #e2e8f0;">
                                    <p style="color:#94a3b8; font-size:11px; margin:0 0 6px;">
                                        <strong>Milton Margai Technical University</strong>
                                    </p>
                                    <p style="color:#94a3b8; font-size:11px; margin:0 0 6px;">
                                        Goderich Campus, Freetown • Sierra Leone
                                    </p>
                                    <p style="color:#cbd5e1; font-size:11px; margin:0;">
                                        © {datetime.utcnow().year} MMTU. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                        
                        <!-- Bottom note -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
                            <tr>
                                <td style="padding:16px 0 0; text-align:center;">
                                    <p style="color:#94a3b8; font-size:11px; margin:0;">
                                        This is an automated message from the MMTU Exams Portal. Please do not reply to this email.
                                    </p>
                                </td>
                            </tr>
                        </table>
                        
                    </td>
                </tr>
            </table>
            
        </body>
        </html>
        """
        
        try:
            msg = Message(
                subject='🔐 MMTU - Your Verification Code',
                recipients=[email],
                html=html,
                sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@mmtu.edu.sl')
            )
            mail.send(msg)
            print(f"✅ 2FA code sent to {email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email to {email}: {e}")
            # Fallback: Print to console for development
            print("\n" + "="*70)
            print("🔐  2FA VERIFICATION CODE (Email failed - console fallback)")
            print(f"📧 Email: {email}")
            print(f"🔑 Code: {code}")
            print("="*70 + "\n")
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