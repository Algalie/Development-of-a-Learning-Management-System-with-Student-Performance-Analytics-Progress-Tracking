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