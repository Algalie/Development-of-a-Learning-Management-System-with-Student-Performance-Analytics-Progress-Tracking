"""
Script to fix student login issues
Save this file in your backend directory and run it with: python fix_student_password.py
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000"  # Change to your server address if needed
# BASE_URL = "http://192.168.1.5:5000"  # Use this if server is on another machine

def print_response(response, title=""):
    """Pretty print API responses"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*60}\n")

def check_server():
    """Check if the Flask server is running"""
    print("🔍 Checking if server is running...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"✅ Server is running! Health check: {response.json()}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {BASE_URL}")
        print("   Make sure your Flask app is running with: python app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def list_all_students():
    """List all registered students"""
    print("📋 Fetching all registered students...")
    try:
        response = requests.get(f"{BASE_URL}/student/debug/students")
        print_response(response, "All Students")
        return response.json()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def reset_password(student_id, new_password):
    """Reset a student's password"""
    print(f"🔑 Resetting password for student: {student_id}")
    try:
        response = requests.post(
            f"{BASE_URL}/student/reset-password",
            json={
                'student_id': student_id,
                'new_password': new_password
            }
        )
        print_response(response, f"Reset Password - {student_id}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_login(student_id, password):
    """Test login with given credentials"""
    print(f"🔐 Testing login for student: {student_id}")
    try:
        response = requests.post(
            f"{BASE_URL}/student/login",
            json={
                'student_id': student_id,
                'password': password
            }
        )
        print_response(response, f"Login Test - {student_id}")
        
        if response.status_code == 200:
            print("✅ LOGIN SUCCESSFUL! 🎉")
            print(f"Token: {response.json().get('token', 'N/A')}")
            return response.json()
        else:
            print("❌ Login failed")
            return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def register_test_student(student_id, email, password):
    """Register a new test student"""
    print(f"📝 Registering new student: {student_id}")
    try:
        response = requests.post(
            f"{BASE_URL}/student/register",
            json={
                'student_id': student_id,
                'email': email,
                'password': password
            }
        )
        print_response(response, f"Registration - {student_id}")
        return response.status_code == 201
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def debug_login(student_id, password):
    """Debug login attempt with detailed info"""
    print(f"🔍 Debug login for student: {student_id}")
    try:
        response = requests.post(
            f"{BASE_URL}/student/debug/test-login",
            json={
                'student_id': student_id,
                'password': password
            }
        )
        print_response(response, f"Debug Login - {student_id}")
        return response.json()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def check_password_hash(student_id):
    """Check stored password hash (if debug endpoint exists)"""
    print(f"🔍 Checking password hash for: {student_id}")
    try:
        response = requests.get(f"{BASE_URL}/student/debug/student-hash/{student_id}")
        print_response(response, f"Password Hash - {student_id}")
        return response.json()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def main():
    """Main function to fix student login issues"""
    print("\n" + "="*60)
    print(" STUDENT LOGIN FIXER TOOL")
    print("="*60 + "\n")
    
    # Step 1: Check if server is running
    if not check_server():
        print("\n❌ Server is not running. Please start your Flask app first:")
        print("   python app.py")
        return
    
    # Step 2: Show all registered students
    students = list_all_students()
    
    # Step 3: Debug the problematic student
    print("\n🔍 Debugging student 7626...")
    debug_login("7626", "123456")
    
    # Step 4: Check the password hash
    check_password_hash("7626")
    
    # Step 5: Ask user what to do
    print("\n" + "="*60)
    print(" OPTIONS:")
    print("="*60)
    print("1. Reset password for student 7626 to '123456'")
    print("2. Register a new test student")
    print("3. Test login with new credentials")
    print("4. Do all of the above automatically")
    print("5. Exit")
    
    choice = input("\nEnter your choice (1-5): ").strip()
    
    if choice == "1":
        # Reset password
        if reset_password("7626", "123456"):
            print("\n✅ Password reset! Now testing login...")
            test_login("7626", "123456")
    
    elif choice == "2":
        # Register new student
        student_id = input("Enter student ID (default: TEST001): ").strip() or "TEST001"
        email = input("Enter email (default: test@example.com): ").strip() or "test@example.com"
        password = input("Enter password (default: 123456): ").strip() or "123456"
        
        if register_test_student(student_id, email, password):
            print("\n✅ Registration successful! Now testing login...")
            test_login(student_id, password)
    
    elif choice == "3":
        # Test login
        student_id = input("Enter student ID: ").strip()
        password = input("Enter password: ").strip()
        test_login(student_id, password)
    
    elif choice == "4":
        # Automatic fix
        print("\n🚀 Running automatic fix...")
        
        # Reset password for 7626
        if reset_password("7626", "123456"):
            print("✅ Password reset for 7626")
        else:
            print("❌ Could not reset password for 7626")
        
        # Register test student
        if register_test_student("TEST001", "test@example.com", "123456"):
            print("✅ Test student registered")
        else:
            print("ℹ️ Test student might already exist")
        
        # Test both logins
        print("\n📊 Testing logins...")
        test_login("7626", "123456")
        test_login("TEST001", "123456")
    
    elif choice == "5":
        print("👋 Goodbye!")
        return
    
    else:
        print("❌ Invalid choice")
    
    print("\n✅ Script completed!")

if __name__ == "__main__":
    # First, make sure requests library is installed
    try:
        import requests
    except ImportError:
        print("❌ 'requests' library is not installed.")
        print("   Install it with: pip install requests")
        exit(1)
    
    main()