from extensions import db
from datetime import datetime, timedelta

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    user_type = db.Column(db.String(20), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    ip_address = db.Column(db.String(50))
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_type': self.user_type,
            'username': self.username,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'is_active': self.is_active,
        }


class TranscriptRecord(db.Model):
    __tablename__ = 'transcript_records'
    id = db.Column(db.Integer, primary_key=True)
    transcript_id = db.Column(db.String(50), unique=True, nullable=False)
    student_id = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    program_type = db.Column(db.String(20))
    department_name = db.Column(db.String(100))
    generated_by_id = db.Column(db.Integer, nullable=False)
    generated_by_name = db.Column(db.String(100))
    transcript_data = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_valid = db.Column(db.Boolean, default=True)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'transcript_id': self.transcript_id,
            'student_id': self.student_id,
            'student_name': self.student_name,
            'program_type': self.program_type,
            'department_name': self.department_name,
            'generated_by_name': self.generated_by_name,
            'transcript_data': json.loads(self.transcript_data) if self.transcript_data else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_valid': self.is_valid,
        }