import google.generativeai as genai
import os
import json

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def ask_ai(question, student_data=None):
    """
    Ask the AI a question about the student's academic data.
    """
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Build context from student data
    context = ""
    if student_data:
        context = f"""
        Student Information:
        - Name: {student_data.get('student_name', 'N/A')}
        - ID: {student_data.get('student_id', 'N/A')}
        - Current GPA: {student_data.get('latest_gpa', 'N/A')}
        - Overall Status: {student_data.get('overall_status', 'N/A')}
        - Level: {student_data.get('latest_level', 'N/A')}
        - Semester: {student_data.get('latest_semester', 'N/A')}
        - Academic Year: {student_data.get('latest_academic_year', 'N/A')}
        - Pending References: {student_data.get('pending_references_count', 0)}
        - Double Fails: {student_data.get('double_fail_count', 0)}
        """
    
    prompt = f"""
    You are an AI Academic Assistant for Milton Margai Technical University (MMTU).
    Answer the student's question based on their academic data.
    Be helpful, encouraging, and professional.
    Keep responses concise (2-4 sentences max).
    
    {context}
    
    Student Question: {question}
    
    Answer:
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"AI Error: {e}")
        return "I'm having trouble processing that right now. Please try again."


def generate_gpa_prediction(student_data):
    """
    Generate GPA prediction and study recommendations.
    """
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    context = f"""
    Student: {student_data.get('student_name', 'N/A')}
    Current GPA: {student_data.get('latest_gpa', 'N/A')}
    Status: {student_data.get('overall_status', 'N/A')}
    Level: {student_data.get('latest_level', 'N/A')}
    Pending References: {student_data.get('pending_references_count', 0)}
    Double Fails: {student_data.get('double_fail_count', 0)}
    """
    
    prompt = f"""
    Based on this student's data, provide:
    1. A brief GPA prediction (1 sentence)
    2. Top 3 study recommendations
    
    {context}
    
    Format your response as JSON:
    {{"prediction": "...", "recommendations": ["...", "...", "..."]}}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Extract JSON from response
        if '{' in text and '}' in text:
            start = text.index('{')
            end = text.rindex('}') + 1
            return json.loads(text[start:end])
        return {"prediction": "Keep up the good work!", "recommendations": ["Stay consistent", "Review past exams", "Attend all lectures"]}
    except:
        return {"prediction": "Continue your current performance.", "recommendations": ["Focus on weak areas", "Practice regularly", "Seek help when needed"]}


def generate_dashboard_summary(stats):
    """
    Generate a natural language summary of dashboard stats.
    """
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    Summarize these university statistics in 2-3 friendly sentences:
    
    - Total Students: {stats.get('total_students', 0)}
    - Total Lecturers: {stats.get('total_lecturers', 0)}
    - Active Courses: {stats.get('total_courses', 0)}
    - Pending Approvals: {stats.get('pending_approvals', 0)}
    - Finalized Today: {stats.get('finalized_today', 0)}
    - Double Fails: {stats.get('double_failures', 0)}
    
    Keep it professional and encouraging.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except:
        return f"The system has {stats.get('total_students', 0)} students and {stats.get('total_courses', 0)} active courses. {stats.get('finalized_today', 0)} submissions were finalized today."