document.addEventListener('DOMContentLoaded', function() {
    initApp();
    loadQuizzes();  
});

let currentQuizId = 1;
let quizzes = [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];

function initApp() {
    initNavigation();
    initEventListeners();
    initQuizCreator();
    initQuizTaker();
    initLeaderboard();
}

function initNavigation() {
    const tabs = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('.content-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.id.replace('-tab', '-section');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    document.getElementById('start-creating-btn')?.addEventListener('click', () => {
        document.getElementById('create-tab').click();
    });
    
    document.getElementById('start-quiz-btn')?.addEventListener('click', () => {
        document.getElementById('take-tab').click();
    });
}

function initEventListeners() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function initQuizCreator() {
    document.getElementById('add-question-btn')?.addEventListener('click', function() {
        const questionType = document.getElementById('question-type-select').value;
        addQuestionToCreator(questionType);
    });
    
    document.getElementById('save-quiz-btn')?.addEventListener('click', saveQuiz);
    
    document.getElementById('preview-quiz-btn')?.addEventListener('click', previewQuiz);
}
function addQuestionToCreator(type) {
    const questionsContainer = document.getElementById('questions-container');
    const questionId = currentQuizId++;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.dataset.id = questionId;
    questionDiv.dataset.type = type;
    
    let optionsHtml = '';
    
    switch(type) {
        case 'single':
            optionsHtml = `
                <div class="options-container" id="options-container-${questionId}">
                    <div class="option-item">
                        <input type="radio" name="correct-${questionId}" id="option-${questionId}-1" checked>
                        <input type="text" class="option-text" placeholder="Option 1">
                        <button class="remove-option-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="option-item">
                        <input type="radio" name="correct-${questionId}" id="option-${questionId}-2">
                        <input type="text" class="option-text" placeholder="Option 2">
                        <button class="remove-option-btn"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <button class="add-option-btn" data-question="${questionId}">Add Option</button>
            `;
            break;
        case 'multiple':
            optionsHtml = `
                <div class="options-container" id="options-container-${questionId}">
                    <div class="option-item">
                        <input type="checkbox" name="correct-${questionId}" id="option-${questionId}-1">
                        <input type="text" class="option-text" placeholder="Option 1">
                        <button class="remove-option-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="option-item">
                        <input type="checkbox" name="correct-${questionId}" id="option-${questionId}-2">
                        <input type="text" class="option-text" placeholder="Option 2">
                        <button class="remove-option-btn"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <button class="add-option-btn" data-question="${questionId}">Add Option</button>
            `;
            break;
        case 'text':
            optionsHtml = `
                <div class="text-answer-container">
                    <input type="text" class="correct-text-answer" placeholder="Enter the correct answer">
                    <div class="text-answer-note">
                        <small>Note: Text answers are case-insensitive</small>
                    </div>
                </div>
            `;
            break;
    }
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <h4>Question ${questionsContainer.children.length + 1}</h4>
            <div class="question-controls">
                <span class="question-type-badge">${getQuestionTypeLabel(type)}</span>
                <button class="remove-question-btn" data-id="${questionId}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="question-content">
            <div class="form-group">
                <label for="question-text-${questionId}">Question Text</label>
                <textarea id="question-text-${questionId}" class="question-text" placeholder="Enter your question here"></textarea>
            </div>
            <div class="form-group">
                <label for="question-points-${questionId}">Points</label>
                <input type="number" id="question-points-${questionId}" class="question-points" min="1" value="1">
            </div>
            <div class="options-section">
                <label>Answer Options</label>
                ${optionsHtml}
            </div>
        </div>
    `;
    
    questionsContainer.appendChild(questionDiv);
    
    addQuestionEventListeners(questionDiv);
}

function addQuestionEventListeners(questionDiv) {
    const removeBtn = questionDiv.querySelector('.remove-question-btn');
    removeBtn.addEventListener('click', function() {
        questionDiv.remove();
        renumberQuestions();
    });
    
    const addOptionBtn = questionDiv.querySelector('.add-option-btn');
    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', function() {
            const questionId = this.dataset.question;
            const optionsContainer = document.getElementById(`options-container-${questionId}`);
            const optionCount = optionsContainer.children.length + 1;
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            
            const inputType = questionDiv.dataset.type === 'single' ? 'radio' : 'checkbox';
            
            optionDiv.innerHTML = `
                <input type="${inputType}" name="correct-${questionId}" id="option-${questionId}-${optionCount}">
                <input type="text" class="option-text" placeholder="Option ${optionCount}">
                <button class="remove-option-btn"><i class="fas fa-times"></i></button>
            `;
            
            optionsContainer.appendChild(optionDiv);
            
            const removeOptionBtn = optionDiv.querySelector('.remove-option-btn');
            removeOptionBtn.addEventListener('click', function() {
                optionDiv.remove();
            });
        });
    }
    
    questionDiv.querySelectorAll('.remove-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const optionItem = this.closest('.option-item');
            if (optionItem.parentElement.children.length > 1) {
                optionItem.remove();
            } else {
                alert('You must have at least one option!');
            }
        });
    });
}

function renumberQuestions() {
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        const header = item.querySelector('.question-header h4');
        header.textContent = `Question ${index + 1}`;
    });
}

function getQuestionTypeLabel(type) {
    switch(type) {
        case 'single': return 'Single Answer';
        case 'multiple': return 'Multiple Choice';
        case 'text': return 'Text Answer';
        default: return 'Unknown Type';
    }
}

function saveQuizzesToStorage() {
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    localStorage.setItem('currentQuizId', currentQuizId);
}

function getQuizzesFromStorage() {
    const storedQuizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    const storedQuizId = parseInt(localStorage.getItem('currentQuizId')) || 1;
    
    currentQuizId = storedQuizId;  
    return storedQuizzes;
}

function saveQuiz() {
    const title = document.getElementById('quiz-title').value.trim();
    const description = document.getElementById('quiz-description').value.trim();
    const tagsInput = document.getElementById('quiz-tags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
    
    if (!title) {
        alert('Please enter a quiz title!');
        return;
    }
    
    const questionItems = document.querySelectorAll('.question-item');
    if (questionItems.length === 0) {
        alert('Please add at least one question to your quiz!');
        return;
    }
    
    const questions = [];
    
    for (const questionItem of questionItems) {
        const questionId = questionItem.dataset.id;
        const questionType = questionItem.dataset.type;
        const questionText = questionItem.querySelector('.question-text').value.trim();
        const points = parseInt(questionItem.querySelector('.question-points').value) || 1;
        
        if (!questionText) {
            alert('Please enter text for all questions!');
            return;
        }
        
        const questionData = {
            id: questionId,
            type: questionType,
            text: questionText,
            points: points,
            options: []
        };
        
        if (questionType === 'single' || questionType === 'multiple') {
            const optionItems = questionItem.querySelectorAll('.option-item');
            
            for (const optionItem of optionItems) {
                const optionText = optionItem.querySelector('.option-text').value.trim();
                const isCorrect = optionItem.querySelector('input[type=radio], input[type=checkbox]').checked;
                
                if (!optionText) {
                    alert('Please enter text for all options!');
                    return;
                }
                
                questionData.options.push({
                    text: optionText,
                    isCorrect: isCorrect
                });
            }
            
            if (!questionData.options.some(option => option.isCorrect)) {
                alert('Please mark at least one correct answer for each question!');
                return;
            }
        } 
        else if (questionType === 'text') {
            const correctAnswer = questionItem.querySelector('.correct-text-answer').value.trim();
            
            if (!correctAnswer) {
                alert('Please enter a correct answer for text questions!');
                return;
            }
            
            questionData.correctAnswer = correctAnswer;
        }
        
        questions.push(questionData);
    }
    
    const quiz = {
        id: currentQuizId++,
        title: title,
        description: description,
        tags: tags,
        questions: questions,
        createdAt: new Date().toISOString(),
        timesPlayed: 0,
        averageScore: 0
    };
    
    quizzes.push(quiz);
    
    saveQuizzesToStorage();
    
    clearQuizForm();
    
    alert('Quiz saved successfully!');
    
    loadQuizzes();
}

function clearQuizForm() {
    document.getElementById('quiz-title').value = '';
    document.getElementById('quiz-description').value = '';
    document.getElementById('quiz-tags').value = '';
    document.getElementById('questions-container').innerHTML = '';
    currentQuestionId = 1;
}
function loadQuizzes() {
    quizzes = getQuizzesFromStorage();
    displayQuizzes();
}

function displayQuizzes() {
    const quizzesGrid = document.getElementById('quizzes-grid');
    
    quizzesGrid.innerHTML = '';      
    if (quizzes.length === 0) {
        quizzesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>No quizzes available. Create your first quiz!</p>
                <button class="btn-primary" id="create-first-quiz-btn">Create Quiz</button>
            </div>
        `;
        document.getElementById('create-first-quiz-btn')?.addEventListener('click', () => {
            document.getElementById('create-tab').click();
        });
    } else {
        quizzes.forEach(quiz => {
            const quizCard = document.createElement('div');
            quizCard.className = 'quiz-card';
            quizCard.dataset.id = quiz.id;
            quizCard.innerHTML = `
                <div class="quiz-card-content">
                    <h3 class="quiz-title">${quiz.title}</h3>
                    <p class="quiz-description">${quiz.description || 'No description provided.'}</p>
                    <div class="quiz-meta">
                        <span class="quiz-questions"><i class="fas fa-question-circle"></i> ${quiz.questions.length} questions</span>
                        <span class="quiz-plays"><i class="fas fa-play"></i> ${quiz.timesPlayed} plays</span>
                    </div>
                </div>
                <div class="quiz-card-footer">
                    <button class="btn-primary take-quiz-btn" data-id="${quiz.id}">Take Quiz</button>
                </div>
            `;
            quizzesGrid.appendChild(quizCard);
            
            quizCard.querySelector('.take-quiz-btn').addEventListener('click', function() {
                startQuiz(parseInt(this.dataset.id));
            });
        });
    }
}

function startQuiz(quizId) {
    currentQuiz = quizzes.find(q => q.id === quizId);
    currentQuestionIndex = 0;
    userAnswers = Array(currentQuiz.questions.length).fill(null);
    
    document.getElementById('quiz-taking-title').textContent = currentQuiz.title;
    document.getElementById('total-questions').textContent = currentQuiz.questions.length;
    
    showQuizQuestion();
    document.getElementById('quiz-taking-modal').style.display = 'block';
}
function showQuizQuestion() {
    const questionData = currentQuiz.questions[currentQuestionIndex];
    const quizTakingBody = document.getElementById('quiz-taking-body');
    
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    
    let questionHtml = `
        <div class="quiz-question">
            <h3 class="question-text">${questionData.text}</h3>
            <div class="question-points">${questionData.points} points</div>
    `;
    if (questionData.type === 'single') {
        questionHtml += `<div class="quiz-options single-choice">`;
        questionData.options.forEach((option, index) => {
            questionHtml += `
                <div class="quiz-option">
                    <input type="radio" name="quiz-answer" id="answer-${index}" value="${index}">
                    <label for="answer-${index}">${option.text}</label>
                </div>
            `;
        });
        questionHtml += `</div>`;
    } else if (questionData.type === 'multiple') {
        questionHtml += `<div class="quiz-options multiple-choice">`;
        questionData.options.forEach((option, index) => {
            questionHtml += `
                <div class="quiz-option">
                    <input type="checkbox" id="answer-${index}" value="${index}">
                    <label for="answer-${index}">${option.text}</label>
                </div>
            `;
        });
        questionHtml += `</div>`;
    } else if (questionData.type === 'text') {
        questionHtml += `
            <div class="quiz-text-answer">
                <input type="text" id="text-answer" placeholder="Enter your answer">
            </div>
        `;
    }
    
    questionHtml += `</div>`;
    
    quizTakingBody.innerHTML = questionHtml;
    updateQuizNavigationButtons();
}
function updateQuizNavigationButtons() {
    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const completeBtn = document.getElementById('complete-quiz-btn');
    
    if (currentQuestionIndex === 0) {
        prevBtn.style.display = 'none'; 
    } else {
        prevBtn.style.display = 'block';
    }
    
    if (currentQuestionIndex === currentQuiz.questions.length - 1) {
        nextBtn.style.display = 'none'; 
        completeBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        completeBtn.style.display = 'none';
    }
}
function saveCurrentAnswer() {
    const questionData = currentQuiz.questions[currentQuestionIndex];
    
    if (questionData.type === 'single') {
        const selectedRadio = document.querySelector('input[name="quiz-answer"]:checked');
        if (selectedRadio) {
            userAnswers[currentQuestionIndex] = {
                questionId: questionData.id,
                selectedOptions: [parseInt(selectedRadio.value)]
            };
        }
    } else if (questionData.type === 'multiple') {
        const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const selectedOptions = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        
        userAnswers[currentQuestionIndex] = {
            questionId: questionData.id,
            selectedOptions: selectedOptions
        };
    } else if (questionData.type === 'text') {
        const textAnswer = document.getElementById('text-answer').value.trim();
        
        userAnswers[currentQuestionIndex] = {
            questionId: questionData.id,
            textAnswer: textAnswer
        };
    }
}
