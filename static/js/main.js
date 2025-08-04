document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    const totalSteps = 6;
    const selectedSymptoms = new Set();
    let userData = {
        demographics: {},
        history: {},
        symptoms: [],
        detailed_symptoms: {}
    };

    // Initialize the interface
    const init = () => {
        showStep(1);
        setupCardSelection();
        setupNavigation();
        setupSymptomSearch();
        setupAgeInput();
    };

    // Navigation
    const updateSidebarNavigation = () => {
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            item.classList.remove('active');
            if (index + 1 === currentStep) {
                item.classList.add('active');
            }
        });
    };

    const showStep = (step) => {
        // Hide all step content
        document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
        
        // Show current step
        const currentStepElement = document.getElementById(`step-${step}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn.style.display = step === 1 ? 'none' : 'block';
        nextBtn.style.display = step === 6 ? 'none' : 'block';
        
        // Update navigation text
        if (nextBtn) {
            nextBtn.textContent = step === 5 ? 'Get Results' : 'Continue';
        }
        
        updateSidebarNavigation();
        
        // Load content for specific steps
        if (step === 3) {
            loadHistoryQuestions();
        }
    };

    // Card-based selection for gender
    const setupCardSelection = () => {
        const selectionCards = document.querySelectorAll('.selection-card');
        selectionCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove selection from all cards
                selectionCards.forEach(c => c.classList.remove('selected'));
                // Add selection to clicked card
                card.classList.add('selected');
                
                // Store the selected value
                const value = card.getAttribute('data-value');
                userData.demographics.gender = value;
                
                // Auto-advance after a short delay
                setTimeout(() => {
                    if (currentStep === 1) {
                        nextStep();
                    }
                }, 500);
            });
        });
    };

    // Age input handling
    const setupAgeInput = () => {
        const ageInput = document.getElementById('age');
        if (ageInput) {
            ageInput.addEventListener('input', (e) => {
                userData.demographics.age = e.target.value;
            });
            
            ageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && ageInput.value) {
                    nextStep();
                }
            });
        }
    };

    // Navigation setup
    const setupNavigation = () => {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const backBtn = document.querySelector('.back-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', prevStep);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', nextStep);
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', prevStep);
        }
        
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const targetStep = index + 1;
                if (targetStep <= currentStep || canNavigateToStep(targetStep)) {
                    currentStep = targetStep;
                    showStep(currentStep);
                }
            });
        });
    };

    const canNavigateToStep = (step) => {
        // Only allow navigation to completed steps or the next immediate step
        return step <= currentStep + 1;
    };

    const nextStep = () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
                
                // Handle specific step transitions
                if (currentStep === 5 && selectedSymptoms.size > 0) {
                    getFollowUpQuestions();
                } else if (currentStep === 6) {
                    analyzeSymptoms();
                }
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    };

    // Validation
    const validateCurrentStep = () => {
        switch(currentStep) {
            case 1:
                if (!userData.demographics.gender) {
                    alert('Please select your biological sex');
                    return false;
                }
                return true;

            case 2:
                const age = document.getElementById('age').value;
                if (!age || age < 0 || age > 120) {
                    alert('Please enter a valid age');
                    return false;
                }
                userData.demographics.age = age;
                return true;

            case 3:
                // Validate history questions
                const selectedOptions = document.querySelectorAll('.history-questions .option-btn.selected');
                if (selectedOptions.length === 0) {
                    alert('Please answer at least one question');
                    return false;
                }
                return true;

            case 4:
                if (selectedSymptoms.size === 0) {
                    alert('Please select at least one symptom');
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    // History questions
    const loadHistoryQuestions = () => {
        const historyContainer = document.querySelector('.history-questions');
        const questions = [
            {
                text: "I've recently suffered an injury",
                options: ["Yes", "No", "Don't know"],
                key: "injury"
            },
            {
                text: "I have smoked cigarettes for at least 10 years",
                options: ["Yes", "No", "Don't know"],
                key: "smoking"
            },
            {
                text: "I, or my parents, siblings or grandparents have an allergic disease (e.g., asthma, atopic dermatitis, or food allergy)",
                options: ["Yes", "No", "Don't know"],
                key: "allergies"
            },
            {
                text: "I'm overweight or obese",
                options: ["Yes", "No", "Don't know"],
                key: "weight"
            },
            {
                text: "I have diabetes",
                options: ["Yes", "No", "Don't know"],
                key: "diabetes"
            },
            {
                text: "I have hypertension",
                options: ["Yes", "No", "Don't know"],
                key: "hypertension"
            }
        ];

        historyContainer.innerHTML = '';
        
        questions.forEach(question => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            
            const questionText = document.createElement('div');
            questionText.className = 'question-text';
            questionText.textContent = question.text;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'question-options';
            
            question.options.forEach(option => {
                const optionBtn = document.createElement('button');
                optionBtn.className = 'option-btn';
                optionBtn.textContent = option;
                optionBtn.addEventListener('click', () => {
                    // Remove selection from siblings
                    optionsDiv.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                    // Select current option
                    optionBtn.classList.add('selected');
                    // Store answer
                    if (!userData.history) userData.history = {};
                    userData.history[question.key] = option;
                });
                optionsDiv.appendChild(optionBtn);
            });
            
            questionDiv.appendChild(questionText);
            questionDiv.appendChild(optionsDiv);
            historyContainer.appendChild(questionDiv);
        });
    };

    // Symptom search functionality
    const setupSymptomSearch = () => {
        const symptomInput = document.getElementById('symptomInput');
        const symptomSuggestions = document.getElementById('symptomSuggestions');
        let typingTimer;
        let lastQuery = '';
        let cachedSuggestions = new Map();

        if (!symptomInput) return;

        symptomInput.addEventListener('input', () => {
            const query = symptomInput.value.trim().toLowerCase();
            
            if (query.length < 2) {
                symptomSuggestions.style.display = 'none';
                return;
            }

            if (cachedSuggestions.has(query)) {
                displaySuggestions(cachedSuggestions.get(query));
                return;
            }

            if (query !== lastQuery) {
                symptomSuggestions.innerHTML = '<div class="suggestion-loading">Finding matching symptoms...</div>';
                symptomSuggestions.style.display = 'block';
            }

            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                if (query !== lastQuery) {
                    lastQuery = query;
                    getSymptomSuggestions(query);
                }
            }, 300);
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!symptomInput.contains(e.target) && !symptomSuggestions.contains(e.target)) {
                symptomSuggestions.style.display = 'none';
            }
        });
    };

    const getSymptomSuggestions = async (input) => {
        try {
            const response = await fetch('/get_symptoms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const suggestions = await response.json();
            displaySuggestions(suggestions);
        } catch (error) {
            console.error('Error getting suggestions:', error);
            const symptomSuggestions = document.getElementById('symptomSuggestions');
            symptomSuggestions.innerHTML = '<div class="suggestion-error">Unable to load suggestions. Please try again.</div>';
        }
    };

    const displaySuggestions = (suggestions) => {
        const symptomSuggestions = document.getElementById('symptomSuggestions');
        
        if (!suggestions || suggestions.length === 0) {
            symptomSuggestions.innerHTML = '<div class="suggestion-empty">No matching symptoms found</div>';
            symptomSuggestions.style.display = 'block';
            return;
        }

        symptomSuggestions.innerHTML = '';
        suggestions.forEach(symptom => {
            if (!selectedSymptoms.has(symptom)) {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = symptom;
                div.onclick = () => addSymptom(symptom);
                symptomSuggestions.appendChild(div);
            }
        });
        
        symptomSuggestions.style.display = 'block';
    };

    const addSymptom = (symptom) => {
        selectedSymptoms.add(symptom);
        updateSelectedSymptoms();
        document.getElementById('symptomInput').value = '';
        document.getElementById('symptomSuggestions').style.display = 'none';
    };

    const updateSelectedSymptoms = () => {
        const container = document.getElementById('selectedSymptoms');
        container.innerHTML = '';
        selectedSymptoms.forEach(symptom => {
            const tag = document.createElement('span');
            tag.className = 'symptom-tag';
            tag.innerHTML = `${symptom} <span class="remove" onclick="removeSymptom('${symptom}')">&times;</span>`;
            container.appendChild(tag);
        });
        userData.symptoms = Array.from(selectedSymptoms);
    };

    window.removeSymptom = (symptom) => {
        selectedSymptoms.delete(symptom);
        updateSelectedSymptoms();
    };

    // Follow-up questions
    const getFollowUpQuestions = async () => {
        try {
            const response = await fetch('/submit_symptoms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            
            if (data.completed) {
                currentStep++;
                showStep(currentStep);
                analyzeSymptoms();
            } else if (data.question) {
                displayFollowUpQuestion(data.question);
            }
        } catch (error) {
            console.error('Error getting follow-up questions:', error);
        }
    };

    const displayFollowUpQuestion = (question) => {
        const container = document.getElementById('followupQuestions');
        container.innerHTML = '';
        
        const questionContainer = document.createElement('div');
        questionContainer.className = 'question-container';
        
        const questionText = document.createElement('h3');
        questionText.textContent = question.question;
        questionContainer.appendChild(questionText);

        // Create input based on question type
        let inputElement;
        if (question.type === 'slider') {
            inputElement = createSliderInput();
        } else if (question.type === 'checkbox') {
            inputElement = createCheckboxInput(question.options);
        } else {
            inputElement = createTextInput();
        }
        
        questionContainer.appendChild(inputElement);
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = 'Submit Answer';
        submitBtn.onclick = () => submitFollowUpAnswer(question);
        questionContainer.appendChild(submitBtn);
        
        container.appendChild(questionContainer);
    };

    const createSliderInput = () => {
        const container = document.createElement('div');
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '10';
        slider.value = '5';
        slider.id = 'current-question';
        slider.className = 'form-range';
        
        const valueDisplay = document.createElement('div');
        valueDisplay.textContent = '5';
        valueDisplay.style.textAlign = 'center';
        valueDisplay.style.marginTop = '1rem';
        
        slider.addEventListener('input', (e) => {
            valueDisplay.textContent = e.target.value;
        });
        
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        return container;
    };

    const createCheckboxInput = (options) => {
        const container = document.createElement('div');
        options.forEach(option => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '0.5rem';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `option-${option}`;
            checkbox.value = option;
            
            const label = document.createElement('label');
            label.htmlFor = `option-${option}`;
            label.textContent = option;
            label.style.marginLeft = '0.5rem';
            
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
        return container;
    };

    const createTextInput = () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'current-question';
        input.className = 'form-control';
        input.style.marginBottom = '1rem';
        return input;
    };

    const submitFollowUpAnswer = async (question) => {
        let answer;
        if (question.type === 'checkbox') {
            const checkedBoxes = document.querySelectorAll('#followupQuestions input[type="checkbox"]:checked');
            answer = Array.from(checkedBoxes).map(cb => cb.value);
        } else {
            const input = document.getElementById('current-question');
            answer = input.value;
        }

        if (!userData.detailed_symptoms) {
            userData.detailed_symptoms = {};
        }
        userData.detailed_symptoms[question.question] = answer;

        await getFollowUpQuestions();
    };

    // Analysis
    const analyzeSymptoms = async () => {
        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const analysis = await response.json();
            displayAnalysis(analysis);
        } catch (error) {
            console.error('Error analyzing symptoms:', error);
            document.getElementById('analysisResults').innerHTML = 
                '<p class="text-danger">Error analyzing symptoms. Please try again.</p>';
        }
    };

    const displayAnalysis = (analysis) => {
        const container = document.getElementById('analysisResults');
        
        let html = '<div class="analysis-content">';
        
        if (analysis.conditions && analysis.conditions.length > 0) {
            html += '<h3>Possible Conditions</h3>';
            analysis.conditions.forEach(condition => {
                html += `
                    <div class="condition-item">
                        <div class="condition-header">
                            <h4 class="condition-name">${condition.name}</h4>
                            <span class="confidence-badge">${condition.confidence}% confidence</span>
                        </div>
                        <p>${condition.explanation}</p>
                    </div>
                `;
            });
        }
        
        if (analysis.tests && analysis.tests.length > 0) {
            html += '<h3>Recommended Tests</h3>';
            analysis.tests.forEach(test => {
                html += `
                    <div class="condition-item">
                        <div class="condition-header">
                            <h4 class="condition-name">${test.name}</h4>
                            <span class="confidence-badge">${test.confidence}% confidence</span>
                        </div>
                        <p>${test.explanation}</p>
                        <small class="text-muted">Priority: ${test.priority}</small>
                    </div>
                `;
            });
        }
        
        if (analysis.urgency) {
            html += `<h3>Urgency Level: <span class="urgency-${analysis.urgency}">${analysis.urgency.toUpperCase()}</span></h3>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    };

    // Initialize the application
    init();
});