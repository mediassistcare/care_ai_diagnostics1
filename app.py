from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from openai_helper import OpenAIHelper
import os

load_dotenv()

app = Flask(__name__)

# Production configuration
app.config['ENV'] = os.getenv('FLASK_ENV', 'production')
app.config['DEBUG'] = os.getenv('DEBUG', 'False').lower() == 'true'

openai_helper = OpenAIHelper()

@app.route('/')
def index():
    # Reset questions when starting a new session
    openai_helper.reset_questions()
    return render_template('index.html')

@app.route('/get_symptoms', methods=['POST'])
def get_symptoms():
    user_input = request.json.get('input', '')
    suggestions = openai_helper.get_symptom_suggestions(user_input)
    return jsonify(suggestions)

@app.route('/submit_symptoms', methods=['POST'])
def submit_symptoms():
    data = request.json
    followup_question = openai_helper.get_followup_questions(data)
    return jsonify(followup_question)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    analysis = openai_helper.analyze_symptoms(data)
    return jsonify(analysis)

if __name__ == '__main__':
    # Use environment variables for production
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=app.config['DEBUG'])