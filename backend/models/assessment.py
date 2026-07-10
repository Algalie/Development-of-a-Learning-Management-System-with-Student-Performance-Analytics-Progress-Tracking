from extensions import db
from datetime import datetime

class ContinuousAssessment(db.Model):
    __tablename__ = 'continuous_assessments'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    assessment_name = db.Column(db.String(100), nullable=False)
    assessment_type = db.Column(db.String(50), nullable=False)
    max_score = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    grades = db.relationship('AssessmentGrade', backref='assessment', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'assessment_name': self.assessment_name,
            'assessment_type': self.assessment_type,
            'max_score': self.max_score,
            'weight': self.weight,
        }


class AssessmentGrade(db.Model):
    __tablename__ = 'assessment_grades'
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('continuous_assessments.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('course_students.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    entered_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    entered_by = db.relationship('Lecturer', foreign_keys=[entered_by_id])
    entered_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('assessment_id', 'student_id', name='unique_assessment_student'),)
