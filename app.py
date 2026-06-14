from flask import Flask, render_template
from flask_cors import CORS
from admin import admin_bp, db, create_default_admin
from lecturer import lecturer_bp
from student import student_bp   # <-- add this import

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-super-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:algalieacama55@localhost/university_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()
    print("✅ Database tables created/verified!")

# Register blueprints
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(lecturer_bp, url_prefix='/lecturer')
app.register_blueprint(student_bp, url_prefix='/student')   # <-- add this line

create_default_admin(app)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)