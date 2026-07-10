import requests
import json

BASE_URL = "http://localhost:5000"

# Step 1: Login
print("1️⃣  Logging in...")
login_response = requests.post(
    f"{BASE_URL}/student/login",
    json={"student_id": "7626", "password": "123456"}
)

if login_response.status_code == 200:
    print("✅ Login successful!")
    token = login_response.json()['token']
    print(f"Token: {token[:50]}...")
    
    # Step 2: Test dashboard
    print("\n2️⃣  Accessing dashboard...")
    dashboard_response = requests.get(
        f"{BASE_URL}/student/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if dashboard_response.status_code == 200:
        print("✅ Dashboard accessed successfully!")
        print(json.dumps(dashboard_response.json(), indent=2)[:500])
    else:
        print(f"❌ Dashboard failed: {dashboard_response.status_code}")
        print(dashboard_response.json())
    
    # Step 3: Test other endpoints
    print("\n3️⃣  Testing other endpoints...")
    
    endpoints = [
        "/student/grades",
        "/student/profile",
        "/student/gpa-history",
        "/student/references",
        "/student/my-info"
    ]
    
    for endpoint in endpoints:
        response = requests.get(
            f"{BASE_URL}{endpoint}",
            headers={"Authorization": f"Bearer {token}"}
        )
        status = "✅" if response.status_code == 200 else "❌"
        print(f"{status} {endpoint}: {response.status_code}")
    
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.json())