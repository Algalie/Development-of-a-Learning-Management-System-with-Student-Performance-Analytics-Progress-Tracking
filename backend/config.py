import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:algalieacama55@localhost/university_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-me')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # 2FA Configuration
    TWO_FA_CODE_LENGTH = 4
    TWO_FA_EXPIRY_MINUTES = 2
    
    # CORS
    # 
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')    
    # Grading scale
    GRADING_SCALE = {
        'A': {'min': 75, 'points': 5.0},
        'B': {'min': 65, 'points': 4.0},
        'C': {'min': 50, 'points': 3.0},
        'D': {'min': 40, 'points': 2.0},
        'E': {'min': 30, 'points': 1.0},
        'F': {'min': 0, 'points': 0.0},
    }
    
    # CA Components
    CA_COMPONENTS = {
        'test': {'max': 20, 'label': 'Test'},
        'assignment': {'max': 10, 'label': 'Assignment'},
        'attendance': {'max': 10, 'label': 'Attendance'},
    }
    CA_TOTAL = 40
    EXAM_TOTAL = 60
    COURSE_TOTAL = 100

class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
    
class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}