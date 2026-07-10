from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from config import config

def token_required(f):
    """Decorator to protect routes with JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'message': 'Authentication token is missing',
                'code': 'TOKEN_MISSING'
            }), 401
        
        try:
            from flask import current_app
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            if datetime.utcnow() > datetime.fromtimestamp(payload['exp']):
                return jsonify({
                    'message': 'Token has expired. Please login again.',
                    'code': 'TOKEN_EXPIRED'
                }), 401
            
            request.user = {
                'user_id': payload['user_id'],
                'id': payload['user_id'],
                'username': payload.get('username'),
                'role': payload['role'],
                'user_type': payload['user_type'],
                'full_name': payload.get('full_name'),
                'email': payload.get('email')
            }
            
            # Track user session
            from extensions import db
            from models.session import UserSession
            
            session = UserSession.query.filter_by(
                user_id=payload['user_id'],
                user_type=payload['user_type'],
                is_active=True
            ).first()
            
            if session:
                session.last_activity = datetime.utcnow()
            else:
                session = UserSession(
                    user_id=payload['user_id'],
                    user_type=payload['user_type'],
                    username=payload.get('username') or payload.get('full_name', 'Unknown'),
                    ip_address=request.remote_addr,
                )
                db.session.add(session)
            
            # Deactivate sessions inactive for more than 15 minutes
            cutoff = datetime.utcnow() - timedelta(minutes=15)
            UserSession.query.filter(
                UserSession.last_activity < cutoff,
                UserSession.is_active == True
            ).update({UserSession.is_active: False})
            
            db.session.commit()
            
        except jwt.InvalidTokenError:
            return jsonify({
                'message': 'Invalid token. Please login again.',
                'code': 'TOKEN_INVALID'
            }), 401
        
        return f(*args, **kwargs)
    
    return decorated

def role_required(*allowed_roles):
    """Decorator to restrict access by role"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'user'):
                return jsonify({
                    'message': 'Authentication required',
                    'code': 'UNAUTHORIZED'
                }), 401
            
            if request.user['role'] not in allowed_roles:
                return jsonify({
                    'message': f'Access restricted to: {", ".join(allowed_roles)}',
                    'code': 'FORBIDDEN'
                }), 403
            
            return f(*args, **kwargs)
        return decorated
    return decorator