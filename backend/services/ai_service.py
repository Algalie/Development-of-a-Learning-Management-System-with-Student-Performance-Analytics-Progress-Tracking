import requests
import os
import json

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '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')
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

def ask_ai(question, student_data=None):
    """AI Academic Assistant using OpenRouter"""
    context = ""
    if student_data:
        context = f"Student GPA: {student_data.get('latest_gpa', 'N/A')}. ID: {student_data.get('student_id', 'N/A')}"

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
                        'content': 'You are an AI Academic Assistant for Milton Margai Technical University. Be helpful, encouraging, and professional. Keep responses short (2-3 sentences).'
                    },
                    {
                        'role': 'user',
                        'content': f"{context}\n\nQuestion: {question}"
                    }
                ],
                'max_tokens': 200,
            },
            timeout=30
        )

        data = response.json()
        print(f"AI Response Status: {response.status_code}")
        print(f"AI Response Data: {json.dumps(data)[:300]}")
        data = response.json()
        print(f"FULL RESPONSE: {json.dumps(data, indent=2)}")

        if 'choices' in data and len(data['choices']) > 0:
            content = data['choices'][0]['message'].get('content', '')
            if content:
                return content.strip()

        return "I'm here to help with your academic questions."

    except Exception as e:
        print(f"AI Error: {e}")
        gpa = student_data.get('latest_gpa') if student_data else None
        if 'gpa' in question.lower():
            return f"Your current GPA is {gpa if gpa else 'not available'}. Keep working hard!"
        if 'hello' in question.lower() or 'hi' in question.lower():
            return f"Hello! Your current GPA is {gpa}. How can I help you today?"
        if 'improve' in question.lower():
            return "To improve: attend all lectures, complete assignments on time, form study groups, and review past exams."
        return "I'm here to help with your academic questions. Ask me about your GPA, grades, or study tips!"


def generate_gpa_prediction(student_data):
    """Generate GPA prediction using OpenRouter"""
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
                        'content': 'You are a GPA prediction system. Return ONLY valid JSON with prediction and recommendations.'
                    },
                    {
                        'role': 'user',
                        'content': f"Based on GPA {student_data.get('latest_gpa')}, predict future performance and give 3 tips. Format: {{\"prediction\": \"...\", \"recommendations\": [\"...\", \"...\", \"...\"]}}"
                    }
                ],
                'max_tokens': 200,
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
                        'content': 'Summarize university statistics in 2-3 friendly sentences.'
                    },
                    {
                        'role': 'user',
                        'content': f"Stats: {stats}"
                    }
                ],
                'max_tokens': 150,
            },
            timeout=30
        )

        data = response.json()
        if 'choices' in data and len(data['choices']) > 0:
            content = data['choices'][0]['message'].get('content', '')
            if content:
                return content.strip()

        return f"The system has {stats.get('total_students', 0)} students and {stats.get('total_courses', 0)} active courses."

    except:
        return f"The system has {stats.get('total_students', 0)} students and {stats.get('total_courses', 0)} active courses."