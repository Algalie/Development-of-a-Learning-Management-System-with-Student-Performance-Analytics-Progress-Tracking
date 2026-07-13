import requests
import os
import json

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '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')
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

def ask_ai(question, student_data=None):
    """AI Academic Assistant using OpenRouter"""
    context = ""
    if student_data:
        sid = student_data.get('student_id', 'Student')
        gpa = student_data.get('latest_gpa', 'N/A')
        context = f"Student ID: {sid}. Current GPA: {gpa}."

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'nvidia/nemotron-nano-9b-v2:free',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are an AI Academic Assistant for Milton Margai Technical University (MMTU). Answer ONLY academic-related questions about GPA, grades, courses, study tips, and university life. For unrelated questions, politely redirect to academic topics. Be helpful, encouraging, and professional. Keep answers under 3 sentences. Grading scale: A=75-100 (5.0), B=65-74 (4.0), C=50-64 (3.0), D=40-49 (2.0), E=30-39 (1.0, needs reference), F=0-29 (0.0, needs reference). First Class requires CGPA of 4.5+. If student GPA is below 3.0, they need reference/resit.'
                    },
                    {
                        'role': 'user',
                        'content': f"{context}\n\nQuestion: {question}"
                    }
                ],
                'max_tokens': 250,
                'temperature': 0.3,
            },
            timeout=30
        )

        data = response.json()

        if 'choices' in data and len(data['choices']) > 0:
            content = data['choices'][0]['message'].get('content', '')
            if content:
                return content.strip()

        return "I'm here to help with your academic questions."

    except Exception as e:
        print(f"AI Error: {e}")
        gpa = student_data.get('latest_gpa') if student_data else None
        sid = student_data.get('student_id', 'Student') if student_data else 'Student'
        q = question.lower()

        if 'gpa' in q or 'grade' in q:
            return f"Student {sid}, your current GPA is {gpa if gpa else 'not available'}. Keep working hard!"
        if 'hello' in q or 'hi' in q:
            return f"Hello {sid}! Your GPA is {gpa}. How can I help you today?"
        if 'improve' in q or 'better' in q:
            return "To improve: attend all lectures, complete assignments on time, form study groups, and review past exam papers."
        if 'reference' in q or 'resit' in q:
            return "Check your dashboard for pending references. Grades E and F require reference/resit. Contact your HOD for arrangements."
        if 'first class' in q:
            return f"First Class requires a CGPA of 4.5+. With your current GPA of {gpa}, focus on scoring 75+ (A grade) in all courses to reach this goal."
        return f"I'm your academic assistant, {sid}. Your GPA is {gpa}. Ask me about grades, study tips, or academic progress."


def generate_gpa_prediction(student_data):
    """Generate GPA prediction using OpenRouter"""
    try:
        gpa = student_data.get('latest_gpa', 'N/A')
        response = requests.post(
            OPENROUTER_URL,
            headers={
                'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'nvidia/nemotron-nano-9b-v2:free',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'Return ONLY valid JSON: {"prediction": "1 sentence", "recommendations": ["tip1", "tip2", "tip3"]}'
                    },
                    {
                        'role': 'user',
                        'content': f"Student GPA: {gpa}. Predict their academic trajectory and give 3 study tips."
                    }
                ],
                'max_tokens': 200,
                'temperature': 0.3,
            },
            timeout=30
        )

        data = response.json()
        if 'choices' in data and len(data['choices']) > 0:
            text = data['choices'][0]['message'].get('content', '')
            if text and '{' in text and '}' in text:
                start = text.index('{')
                end = text.rindex('}') + 1
                return json.loads(text[start:end])

        return {"prediction": "Keep up the good work!", "recommendations": ["Stay consistent", "Review past exams", "Attend all lectures"]}

    except:
        return {"prediction": "Continue your current performance.", "recommendations": ["Focus on weak areas", "Practice regularly", "Seek help when needed"]}


def generate_dashboard_summary(stats):
    """Generate dashboard summary using OpenRouter"""
    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'nvidia/nemotron-nano-9b-v2:free',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'Summarize these university statistics in 2 sentences.'
                    },
                    {
                        'role': 'user',
                        'content': f"Stats: {stats}"
                    }
                ],
                'max_tokens': 150,
                'temperature': 0.3,
            },
            timeout=30
        )

        data = response.json()
        if 'choices' in data and len(data['choices']) > 0:
            content = data['choices'][0]['message'].get('content', '')
            if content:
                return content.strip()

        return f"The system has {stats.get('total_students', 0)} students and {stats.get('total_courses', 0)} active courses. {stats.get('finalized_today', 0)} submissions finalized today."

    except:
        return f"The system has {stats.get('total_students', 0)} students and {stats.get('total_courses', 0)} active courses."