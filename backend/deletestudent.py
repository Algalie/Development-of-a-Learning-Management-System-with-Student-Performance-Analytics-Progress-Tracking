import requests

# Login
login = requests.post('http://10.65.120.167:5000/student/login', json={
    'student_id': '7720',
    'password': '7720'  # your student password
})
token = login.json().get('token')

# Get GPA history
response = requests.get('http://10.65.120.167:5000/student/gpa-history',
    params={'academic_year': '2026/2027'},
    headers={'Authorization': f'Bearer {token}'}
)

print(response.json())