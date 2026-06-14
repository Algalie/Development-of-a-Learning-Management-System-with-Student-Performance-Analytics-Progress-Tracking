from database import get_db_connection
import random

class User:
    def __init__(self, id, username, email, full_name, role):
        self.id = id
        self.username = username
        self.email = email
        self.full_name = full_name
        self.role = role
    
    @staticmethod
    def authenticate(username, password):
        """Authenticate user with username and password"""
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT * FROM users WHERE username = %s AND password = %s",
            (username, password)
        )
        user_data = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if user_data:
            return User(
                id=user_data['id'],
                username=user_data['username'],
                email=user_data['email'],
                full_name=user_data['full_name'],
                role=user_data['role']
            )
        return None
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_data = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if user_data:
            return User(
                id=user_data['id'],
                username=user_data['username'],
                email=user_data['email'],
                full_name=user_data['full_name'],
                role=user_data['role']
            )
        return None

class TwoFactorAuth:
    @staticmethod
    def generate_code():
        """Generate 4-digit 2FA code"""
        return str(random.randint(1000, 9999))
    
    @staticmethod
    def send_code(email, code):
        """Simulate sending 2FA code (prints to terminal)"""
        print("\n" + "="*50)
        print("2FA AUTHENTICATION CODE")
        print("="*50)
        print(f"To: {email}")
        print(f"Your 4-digit verification code is: {code}")
        print("="*50 + "\n")
        return True