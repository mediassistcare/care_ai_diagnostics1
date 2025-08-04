import os
import json
import re
from openai import OpenAI
from typing import List, Dict

class OpenAIHelper:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "gpt-4o-mini"
        self.question_history = []

    def _clean_json_response(self, content: str) -> str:
        """Clean the response content by removing markdown code blocks and other formatting."""
        # Remove markdown code blocks
        content = re.sub(r'```(?:json)?\s*(.*?)\s*```', r'\1', content, flags=re.DOTALL)
        # Remove leading/trailing whitespace and newlines
        content = content.strip()
        return content

    def get_symptom_suggestions(self, user_input: str) -> List[str]:
        # Create a comprehensive prompt for symptom matching
        prompt = f"""User input: '{user_input}'
        Provide EXACTLY 10 relevant medical symptoms as suggestions.

        Guidelines:
        1. Ensure direct relevance to the input
        2. Include both exact matches and related symptoms
        3. Use simple, everyday language
        4. Keep descriptions to 2-4 words
        5. List EXACTLY 10 suggestions, no more, no less
        6. Format: "symptom (brief description)"

        Example format for "headache":
        [
            "headache (pain in head)",
            "migraine (severe pulsing headache)",
            "tension headache (tight band feeling)",
            "sinus pain (face pressure)",
            "neck pain (stiff neck)",
            "dizziness (room spinning)",
            "eye strain (tired eyes)",
            "ear pain (throbbing ear)",
            "fever (high temperature)",
            "fatigue (feeling very tired)"
        ]

        Important: 
        - Always return exactly 10 items
        - Ensure first suggestions are most relevant
        - Include common related symptoms
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "system",
                    "content": "You are a medical symptom suggestion system. Provide relevant symptom suggestions in simple language."
                },
                {
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.3,
                max_tokens=500,  # Ensure enough tokens for 10 suggestions
                presence_penalty=0.3,  # Slightly encourage diverse suggestions
                frequency_penalty=0.3   # Discourage repetition
            )
            
            content = self._clean_json_response(response.choices[0].message.content)
            suggestions = json.loads(content)
            
            # Ensure exactly 10 suggestions
            if len(suggestions) < 10:
                # If we have too few suggestions, add generic related symptoms
                additional_prompt = f"List additional general symptoms that could be related to '{user_input}'"
                additional_response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": additional_prompt}],
                    temperature=0.4
                )
                additional_content = self._clean_json_response(additional_response.choices[0].message.content)
                try:
                    additional_suggestions = json.loads(additional_content)
                    suggestions.extend([s for s in additional_suggestions if s not in suggestions])
                except:
                    # Fallback: add some common symptoms
                    common_symptoms = [
                        "fatigue (feeling very tired)",
                        "fever (elevated temperature)",
                        "pain (general discomfort)",
                        "weakness (reduced strength)",
                        "dizziness (light headed feeling)"
                    ]
                    suggestions.extend([s for s in common_symptoms if s not in suggestions])
            
            # Ensure exactly 10 items
            return suggestions[:10]
            
        except Exception as e:
            print(f"Error in get_symptom_suggestions: {e}")
            # Fallback suggestions
            return [
                f"{user_input} (main symptom)",
                "fever (high temperature)",
                "pain (general discomfort)",
                "fatigue (feeling tired)",
                "headache (head pain)",
                "nausea (feeling sick)",
                "dizziness (light headed)",
                "weakness (reduced strength)",
                "chills (feeling cold)",
                "sweating (excess moisture)"
            ]

    def get_followup_questions(self, data: Dict) -> Dict:
        symptoms = data.get('symptoms', [])
        previous_answers = data.get('detailed_symptoms', {})
        
        # If we already have 5 questions answered, return empty
        if len(self.question_history) >= 5:
            return {"question": None, "completed": True}
            
        prompt = f"""Given these symptoms: {', '.join(symptoms)}
        And these previous Q&A: {json.dumps(previous_answers)}
        Previous questions asked: {json.dumps(self.question_history)}
        
        Generate ONE follow-up question that:
        1. Focuses on the most concerning or unclear aspect
        2. Takes into account previous answers
        3. Is different from previous questions
        4. Is specific and targeted
        
        Return as JSON with format:
        {{
            "question": "the question text",
            "type": "slider/checkbox/text",
            "options": ["option1", "option2"] // only for checkbox type
        }}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = self._clean_json_response(response.choices[0].message.content)
            question_data = json.loads(content)
            
            # Store the question to avoid repetition
            if question_data.get('question'):
                self.question_history.append(question_data['question'])
            
            return {"question": question_data, "completed": False}
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing followup question: {e}")
            return {"question": None, "completed": True}

    def analyze_symptoms(self, data: Dict) -> Dict:
        prompt = f"""Given this patient data:
        - Demographics: {data.get('demographics', {})}
        - Medical history: {data.get('history', {})}
        - Symptoms: {data.get('symptoms', [])}
        - Detailed symptoms: {data.get('detailed_symptoms', {})}
        
        Provide a detailed analysis with exactly this JSON format:
        {{
            "conditions": [
                {{
                    "name": "condition name",
                    "explanation": "One line explanation why this condition matches the symptoms",
                    "confidence": 85  // confidence score between 0-100
                }}
            ],
            "tests": [
                {{
                    "name": "test name",
                    "explanation": "Why this test is recommended and what it will help confirm/rule out",
                    "priority": "high/medium/low",
                    "confidence": 75  // confidence score between 0-100 for how likely this test will be useful
                }}
            ],
            "urgency": "routine/urgent/emergency"
        }}

        List maximum 3 most likely conditions and maximum 5 recommended tests based on the symptoms and history.
        
        Confidence scores should reflect:
        For conditions:
        - How well symptoms match known patterns
        - Relevance of patient history and demographics
        - Specificity of the symptoms
        - Quality and completeness of information provided
        
        For tests:
        - How likely the test will provide useful diagnostic information
        - Relevance to the suspected conditions
        - Cost-effectiveness and invasiveness considerations
        - Standard medical practice for these symptoms"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = self._clean_json_response(response.choices[0].message.content)
            result = json.loads(content)
            
            # Validate the response format
            if not all(key in result for key in ['conditions', 'tests', 'urgency']):
                raise KeyError("Missing required keys in response")
            
            # Validate condition format
            for condition in result['conditions']:
                if not all(key in condition for key in ['name', 'explanation', 'confidence']):
                    raise KeyError("Invalid condition format")
            
            # Validate test format
            for test in result['tests']:
                if not all(key in test for key in ['name', 'explanation', 'priority', 'confidence']):
                    raise KeyError("Invalid test format")
                
            return result
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing analysis: {e}")
            return {
                'conditions': [{
                    'name': 'Unable to analyze symptoms',
                    'explanation': 'Not enough information to make a reliable analysis',
                    'confidence': 0
                }],
                'tests': [{
                    'name': 'Consult healthcare provider',
                    'explanation': 'A proper medical evaluation is needed for accurate diagnosis',
                    'priority': 'high',
                    'confidence': 95
                }],
                'urgency': 'routine'
            }

    def reset_questions(self):
        """Reset the question history when starting a new symptom check"""
        self.question_history = []