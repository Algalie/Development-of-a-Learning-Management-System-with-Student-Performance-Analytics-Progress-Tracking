import requests
import os
import json

# Your OpenRouter API key
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
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
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'MMTU GPA System',
            },
            json={
                'model': 'google/gemini-2.0-flash-001',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are an AI Academic Assistant for MMTU. Be helpful, encouraging, and professional. Keep responses short (2-3 sentences).'
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
        if 'choices' in data and len(data['choices']) > 0:
            return data['choices'][0]['message']['content'].strip()
        
        return "I'm processing your question. Please try again."
        
    except Exception as e:
        print(f"AI Error: {e}")
        gpa = student_data.get('latest_gpa') if student_data else None
        if 'gpa' in question.lower():
            return f"Your current GPA is {gpa if gpa else 'not available'}. Keep working hard!"
        if 'hello' in question.lower() or 'hi' in question.lower():
            return f"Hello! Your GPA is {gpa}. How can I help you today?"
        return "I'm here to help with your academic questions."
    


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
                'model': 'google/gemini-2.0-flash-001',
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
        text = data['choices'][0]['message']['content']
        
        if '{' in text and '}' in text:
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
                'model': 'google/gemini-2.0-flash-001',
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
        return data['choices'][0]['message']['content'].strip()
        
    except:
        return f"The system has {stats.get('total_students', 0)} students and {stats.get('total_courses', 0)} active courses."    