from flask import Blueprint, request, jsonify
from models.user import Admin, Lecturer, Student
from services.auth_service import AuthService
from middleware.jwt_required import token_required
from extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin first-step login - returns 2FA requirement"""
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'message': 'Username and password required', 'code': 'MISSING_FIELDS'}), 400
    
    admin = Admin.query.filter_by(username=username, password=password).first()
    if not admin:
        return jsonify({'message': 'Invalid credentials', 'code': 'INVALID_CREDENTIALS'}), 401
    
    code = AuthService.generate_2fa_code()
    AuthService.store_2fa_code(admin.email, code, 'admin')
    AuthService.send_2fa_code(admin.email, code)
    
    return jsonify({
        'message': '2FA code sent to your email',
        'requires_2fa': True,
        'email': admin.email,
        'email_hint': f"{admin.email[:3]}***@***{admin.email[-4:]}",
        'temp_token': AuthService.create_temp_token(admin.id, 'admin'),
        'dev_2fa_code': code
    }), 200

@auth_bp.route('/admin/verify-2fa', methods=['POST'])
def admin_verify_2fa():
    """Verify 2FA and return JWT"""
    data = request.get_json() or {}
    temp_token = data.get('temp_token', '')
    code = data.get('code', '')
    
    if not temp_token or not code:
        return jsonify({'message': 'Verification code required', 'code': 'MISSING_FIELDS'}), 400
    
    temp_data = AuthService.verify_temp_token(temp_token)
    if not temp_data or temp_data['type'] != 'admin':
        return jsonify({'message': 'Session expired. Please login again.', 'code': 'SESSION_EXPIRED'}), 401
    
    admin = Admin.query.get(temp_data['user_id'])
    if not AuthService.verify_2fa_code(admin.email, code):
        return jsonify({'message': 'Invalid verification code', 'code': 'INVALID_CODE'}), 401
    
    admin.last_login = db.func.now()
    db.session.commit()
    
    token = AuthService.generate_jwt({
        'user_id': admin.id,
        'username': admin.username,
        'role': admin.role,
        'user_type': 'admin',
        'full_name': admin.full_name,
        'email': admin.email
    })
    
    return jsonify({
        'token': token,
        'user': {
            'id': admin.id,
            'username': admin.username,
            'full_name': admin.full_name,
            'role': admin.role,
            'email': admin.email
        },
        'message': f'Welcome back, {admin.full_name}!'
    })

@auth_bp.route('/lecturer/login', methods=['POST'])
def lecturer_login():
    """Lecturer login with 2FA"""
    data = request.get_json() or {}
    lecturer_id = data.get('lecturer_id', '').strip()
    password = data.get('password', '').strip()
    
    if not lecturer_id or not password:
        return jsonify({'message': 'Lecturer ID and password required', 'code': 'MISSING_FIELDS'}), 400
    
    lecturer = Lecturer.query.filter_by(lecturer_id=lecturer_id, password=password).first()
    if not lecturer:
        return jsonify({'message': 'Invalid credentials', 'code': 'INVALID_CREDENTIALS'}), 401
    
    code = AuthService.generate_2fa_code()
    AuthService.store_2fa_code(lecturer.email, code, 'lecturer')
    AuthService.send_2fa_code(lecturer.email, code)
    
    return jsonify({
        'message': '2FA code sent to your email',
        'requires_2fa': True,
        'email': lecturer.email,
        'email_hint': f"{lecturer.email[:3]}***@***{lecturer.email[-4:]}",
        'temp_token': AuthService.create_temp_token(lecturer.id, 'lecturer'),
        'dev_2fa_code': code
    })

@auth_bp.route('/lecturer/verify-2fa', methods=['POST'])
def lecturer_verify_2fa():
    """Verify lecturer 2FA"""
    data = request.get_json() or {}
    temp_token = data.get('temp_token', '')
    code = data.get('code', '')
    
    temp_data = AuthService.verify_temp_token(temp_token)
    if not temp_data or temp_data['type'] != 'lecturer':
        return jsonify({'message': 'Session expired', 'code': 'SESSION_EXPIRED'}), 401
    
    lecturer = Lecturer.query.get(temp_data['user_id'])
    if not AuthService.verify_2fa_code(lecturer.email, code):
        return jsonify({'message': 'Invalid code', 'code': 'INVALID_CODE'}), 401
    
    lecturer.last_login = db.func.now()
    db.session.commit()
    
    token = AuthService.generate_jwt({
        'user_id': lecturer.id,
        'username': lecturer.lecturer_id,
        'role': lecturer.role,
        'user_type': 'lecturer',
        'full_name': lecturer.full_name,
        'email': lecturer.email
    })
    
    return jsonify({
        'token': token,
        'user': {
            'id': lecturer.id,
            'lecturer_id': lecturer.lecturer_id,
            'full_name': lecturer.full_name,
            'role': lecturer.role,
            'email': lecturer.email,
            'department': lecturer.get_display_department()
        },
        'message': f'Welcome, {lecturer.full_name}!'
    })

@auth_bp.route('/student/login', methods=['POST'])
def student_login():
    """Student login (no 2FA)"""
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    password = data.get('password', '').strip()
    
    from routes.student_routes import login
    return login()

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current authenticated user info"""
    user = request.user
    
    extra = {}
    if user['user_type'] == 'admin':
        from models.user import Admin
        admin = Admin.query.get(user['user_id'])
        if admin:
            extra = {
                'username': admin.username,
                'role': admin.role,
                'created_at': admin.created_at.isoformat() if admin.created_at else None
            }
    elif user['user_type'] == 'lecturer':
        from models.user import Lecturer
        lecturer = Lecturer.query.get(user['user_id'])
        if lecturer:
            extra = {
                'lecturer_id': lecturer.lecturer_id,
                'phone': lecturer.phone,
                'qualification': lecturer.qualification,
                'department': lecturer.get_display_department(),
                'faculty': lecturer.faculty.name if lecturer.faculty else None,
                'role': lecturer.role,
            }
    
    return jsonify({
        'user': {**user, **extra}
    })

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout - client should discard token"""
    return jsonify({'message': 'Logged out successfully'})