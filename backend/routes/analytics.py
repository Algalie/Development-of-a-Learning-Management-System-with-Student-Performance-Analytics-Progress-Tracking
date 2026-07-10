from flask import Blueprint, request, jsonify
from middleware.jwt_required import token_required
from extensions import db
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/live-stats', methods=['GET'])
@token_required
def live_stats():
    """Get real-time system statistics"""
    from models.session import UserSession
    from models.approval import ApprovalRequest
    
    # Active users (last 15 minutes)
    cutoff = datetime.utcnow() - timedelta(minutes=15)
    active_sessions = UserSession.query.filter(
        UserSession.last_activity >= cutoff,
        UserSession.is_active == True
    ).all()
    
    active_users = len(active_sessions)
    
    # Active users by type
    admin_count = sum(1 for s in active_sessions if s.user_type == 'admin')
    lecturer_count = sum(1 for s in active_sessions if s.user_type == 'lecturer')
    
    # Requests in last minute (approximate by recent approvals)
    one_min_ago = datetime.utcnow() - timedelta(minutes=1)
    recent_approvals = ApprovalRequest.query.filter(
        ApprovalRequest.finalized_at >= one_min_ago
    ).count()
    recent_submissions = ApprovalRequest.query.filter(
        ApprovalRequest.submitted_at >= one_min_ago
    ).count()
    
    requests_per_min = recent_approvals + recent_submissions
    
    # Active user details
    active_user_list = [s.to_dict() for s in active_sessions]
    
    # Uptime (since first session created)
    first_session = UserSession.query.order_by(UserSession.created_at.asc()).first()
    uptime_seconds = 0
    if first_session:
        uptime_seconds = (datetime.utcnow() - first_session.created_at).total_seconds()
    
    return jsonify({
        'active_users': active_users,
        'admin_count': admin_count,
        'lecturer_count': lecturer_count,
        'requests_per_min': requests_per_min,
        'uptime_seconds': int(uptime_seconds),
        'active_user_list': active_user_list,
        'timestamp': datetime.utcnow().isoformat(),
    })