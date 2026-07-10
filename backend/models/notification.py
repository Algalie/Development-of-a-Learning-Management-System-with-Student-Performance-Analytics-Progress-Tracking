from extensions import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    user_type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(30), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('approval_requests.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    is_dismissed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_icon(self):
        icons = {'submission': '📩', 'approval_progress': '✅', 'finalized': '🎉', 'rejection': '❌', 'info': 'ℹ️'}
        return icons.get(self.notification_type, '📌')

    def time_ago(self):
        diff = datetime.utcnow() - self.created_at
        if diff.days > 7:
            return self.created_at.strftime('%b %d')
        if diff.days > 0:
            return f"{diff.days}d ago"
        if diff.seconds >= 3600:
            return f"{diff.seconds // 3600}h ago"
        if diff.seconds >= 60:
            return f"{diff.seconds // 60}m ago"
        return "Just now"

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_type': self.user_type,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'request_id': self.request_id,
            'is_read': self.is_read,
            'is_dismissed': self.is_dismissed,
            'icon': self.get_icon(),
            'time_ago': self.time_ago(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
