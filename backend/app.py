from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from extensions import db
import os
from routes.student import student_bp
from routes.analytics import analytics_bp

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    CORS(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'])
    db.init_app(app)
    
    register_error_handlers(app)
    
    with app.app_context():
        import models
        db.create_all()
        seed_default_data()
        
        from routes.auth import auth_bp
        from routes.admin import admin_bp
        from routes.lecturer import lecturer_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(lecturer_bp, url_prefix='/api/lecturer')
        app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
        app.register_blueprint(student_bp, url_prefix='/student')


    
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'version': '2.0.0'})
    
    return app

def seed_default_data():
    from models.user import Admin
    admin = Admin.query.filter_by(username='Kamara').first()
    if not admin:
        db.session.add(Admin(
            username='Kamara',
            email='kamaraalgalie&&@gmail.com',
            password='default123',
            full_name='Algalie Kamara',
            role='super_admin'
        ))
        db.session.commit()
        print("✅ Default admin created: Kamara / default123")
    else:
        print("✅ Admin already exists")

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad Request', 'message': 'Invalid request', 'code': 'BAD_REQUEST'}), 400
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized', 'message': 'Authentication required', 'code': 'UNAUTHORIZED'}), 401
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden', 'message': 'Access denied', 'code': 'FORBIDDEN'}), 403
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': 'Resource not found', 'code': 'NOT_FOUND'}), 404
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error', 'message': str(error), 'code': 'INTERNAL_ERROR'}), 500

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)