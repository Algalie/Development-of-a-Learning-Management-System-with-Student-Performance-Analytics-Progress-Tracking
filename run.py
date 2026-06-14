# run.py
from app import app
import sys

if __name__ == '__main__':
    # Disable output buffering
    sys.stdout.reconfigure(line_buffering=True)
    app.run(port=5000, host='0.0.0.0', debug=True)