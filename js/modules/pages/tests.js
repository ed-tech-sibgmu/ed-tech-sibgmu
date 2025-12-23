/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tests Module
 * Генерация и прохождение тестов
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class TestsPage {
    constructor(app) {
        this.app = app;
        this.container = null;

        // Текущий тест
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.testStartTime = null;

        // Конфигурация генерации
        this.config = {
            topic: '',
            questionCount: 20,
            questionTypes: ['single', 'multiple', 'matching'],
            difficulty: 'mixed' // easy, medium, hard, mixed
        };

        // Сохранённые тесты
        this.tests = this.app.storage.get('tests') || [];
    }

    /**
     * Рендер страницы
     */
    render(container) {
        this.container = container;
        this.tests = this.app.storage.get('tests') || [];

        container.innerHTML = `
            <div class="page tests-page">
                <div class="tests-layout">
                <!-- Основная область (слева) -->
                <main class="tests-main" id="tests-main">
                    ${this.renderWelcome()}
                </main>
                
                <!-- Сайдбар с тестами (справа) -->
                <aside class="tests-sidebar">
                    <div class="tests-sidebar-header">
                        <h2>Мои тесты</h2>
                        <button class="btn btn-primary btn-sm" id="new-test-btn">
                            <i data-lucide="plus"></i>
                            Создать
                        </button>
                    </div>
                    
                    <div class="tests-list" id="tests-list">
                        ${this.renderTestsList()}
                    </div>
                </aside>
            </div>
            </div>
        `;

        this.bindEvents();
        lucide.createIcons();
    }

    /**
     * Рендер списка тестов
     */
    renderTestsList() {
        if (this.tests.length === 0) {
            return `
                <div class="empty-state small">
                    <i data-lucide="clipboard-list"></i>
                    <p>Нет сохранённых тестов</p>
                </div>
            `;
        }

        return this.tests.map((test, index) => `
            <div class="test-item ${this.currentTest?.id === test.id ? 'active' : ''}" 
                 data-test-id="${test.id}">
                <div class="test-item-content">
                    <div class="test-item-title">${test.title}</div>
                    <div class="test-item-meta">
                        <span>${test.questions.length} вопросов</span>
                        ${test.lastScore !== undefined ? `
                            <span class="test-score ${this.getScoreClass(test.lastScore)}">
                                ${test.lastScore}%
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="test-item-actions">
                    <button class="btn-icon" data-action="start" title="Начать тест">
                        <i data-lucide="play"></i>
                    </button>
                    <button class="btn-icon" data-action="delete" title="Удалить">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Приветственный экран
     */
    renderWelcome() {
        return `
            <div class="tests-welcome">
                <div class="welcome-icon">
                    <i data-lucide="clipboard-check"></i>
                </div>
                <h2>Тестирование знаний</h2>
                <p>Создайте тест по теме или выберите существующий из списка слева</p>
                <button class="btn btn-primary btn-lg" id="welcome-new-test">
                    <i data-lucide="sparkles"></i>
                    Сгенерировать тест
                </button>
            </div>
        `;
    }

    /**
     * Форма создания теста
     */
    renderCreateForm() {
        const profile = this.app.storage.get('user_profile') || {};

        return `
            <div class="test-create-form">
                <div class="form-header">
                    <h2>Создание теста</h2>
                    <button class="btn-icon" id="close-create-form">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="form-body">
                    <div class="input-group">
                        <label>Тема теста</label>
                        <input type="text" id="test-topic" 
                               placeholder="Например: Цикл Кребса, органическая химия..."
                               value="${profile.topic || ''}">
                        <span class="input-hint">
                            Укажите тему или оставьте из профиля
                        </span>
                    </div>
                    
                    <div class="input-group">
                        <label>Количество вопросов</label>
                        <div class="slider-container">
                            <input type="range" id="question-count" 
                                   min="5" max="50" step="5" value="20">
                            <span class="slider-value" id="question-count-value">20</span>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Типы вопросов</label>
                        <div class="checkbox-group">
                            <label class="checkbox-option">
                                <input type="checkbox" name="q-type" value="single" checked>
                                <span class="checkbox-label">
                                    <i data-lucide="circle-dot"></i>
                                    Один ответ
                                </span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="q-type" value="multiple" checked>
                                <span class="checkbox-label">
                                    <i data-lucide="check-square"></i>
                                    Несколько ответов
                                </span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="q-type" value="matching" checked>
                                <span class="checkbox-label">
                                    <i data-lucide="git-merge"></i>
                                    Сопоставление
                                </span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="q-type" value="open">
                                <span class="checkbox-label">
                                    <i data-lucide="text"></i>
                                    Открытый ответ
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Сложность</label>
                        <div class="radio-group horizontal">
                            <label class="radio-option">
                                <input type="radio" name="difficulty" value="easy">
                                <span>Лёгкая</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="difficulty" value="medium">
                                <span>Средняя</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="difficulty" value="hard">
                                <span>Сложная</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="difficulty" value="mixed" checked>
                                <span>Микс</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-footer">
                    <button class="btn btn-outline" id="cancel-create">Отмена</button>
                    <button class="btn btn-primary" id="generate-test">
                        <i data-lucide="sparkles"></i>
                        Сгенерировать
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Экран прохождения теста
     */
    renderTestScreen() {
        const question = this.currentTest.questions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.currentTest.questions.length) * 100;

        return `
            <div class="test-screen">
                <!-- Хедер теста -->
                <div class="test-header">
                    <div class="test-progress">
                        <div class="test-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="test-info">
                        <span class="test-counter">
                            Вопрос ${this.currentQuestionIndex + 1} из ${this.currentTest.questions.length}
                        </span>
                        <button class="btn-icon" id="exit-test" title="Завершить тест">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Вопрос -->
                <div class="test-question">
                    <div class="question-type-badge ${question.type}">
                        ${this.getQuestionTypeName(question.type)}
                    </div>
                    <h3 class="question-text">${question.text}</h3>
                    
                    <div class="question-answers">
                        ${this.renderAnswers(question)}
                    </div>
                </div>
                
                <!-- Футер теста -->
                <div class="test-footer">
                    <button class="btn btn-outline" id="prev-question" 
                            ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                        <i data-lucide="arrow-left"></i>
                        Назад
                    </button>
                    
                    <div class="question-dots">
                        ${this.currentTest.questions.map((_, i) => `
                            <span class="dot ${i === this.currentQuestionIndex ? 'current' : ''} 
                                  ${this.userAnswers[i] !== undefined ? 'answered' : ''}"
                                  data-question="${i}"></span>
                        `).join('')}
                    </div>
                    
                    <button class="btn btn-primary" id="next-question">
                        ${this.currentQuestionIndex === this.currentTest.questions.length - 1
                ? 'Завершить'
                : 'Далее'}
                        <i data-lucide="${this.currentQuestionIndex === this.currentTest.questions.length - 1
                ? 'check' : 'arrow-right'}"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Рендер вариантов ответа
     */
    renderAnswers(question) {
        const currentAnswer = this.userAnswers[this.currentQuestionIndex];

        switch (question.type) {
            case 'single':
                return question.options.map((option, i) => `
                    <label class="answer-option ${currentAnswer === i ? 'selected' : ''}">
                        <input type="radio" name="answer" value="${i}" 
                               ${currentAnswer === i ? 'checked' : ''}>
                        <span class="answer-marker"></span>
                        <span class="answer-text">${option}</span>
                    </label>
                `).join('');

            case 'multiple':
                const selectedMultiple = currentAnswer || [];
                return question.options.map((option, i) => `
                    <label class="answer-option checkbox ${selectedMultiple.includes(i) ? 'selected' : ''}">
                        <input type="checkbox" name="answer" value="${i}"
                               ${selectedMultiple.includes(i) ? 'checked' : ''}>
                        <span class="answer-marker"></span>
                        <span class="answer-text">${option}</span>
                    </label>
                `).join('');

            case 'matching':
                return this.renderMatchingQuestion(question, currentAnswer);

            case 'open':
                return `
                    <div class="open-answer">
                        <textarea id="open-answer-input" 
                                  placeholder="Введите ваш ответ..."
                                  rows="4">${currentAnswer || ''}</textarea>
                    </div>
                `;

            default:
                return '';
        }
    }

    /**
     * Рендер вопроса на сопоставление
     */
    renderMatchingQuestion(question, currentAnswer) {
        const matches = currentAnswer || {};

        return `
            <div class="matching-question">
                <div class="matching-left">
                    ${question.left.map((item, i) => `
                        <div class="matching-item left" data-index="${i}">
                            <span class="matching-text">${item}</span>
                            <select class="matching-select" data-left="${i}">
                                <option value="">Выберите...</option>
                                ${question.right.map((rightItem, j) => `
                                    <option value="${j}" ${matches[i] === j ? 'selected' : ''}>
                                        ${rightItem}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Экран результатов
     */
    renderResults() {
        const results = this.calculateResults();
        const scoreClass = this.getScoreClass(results.percentage);

        return `
            <div class="test-results">
                <div class="results-header ${scoreClass}">
                    <div class="results-score">
                        <span class="score-value">${results.percentage}%</span>
                        <span class="score-label">правильных ответов</span>
                    </div>
                    <div class="results-stats">
                        <div class="stat">
                            <i data-lucide="check-circle"></i>
                            <span>${results.correct} из ${results.total}</span>
                        </div>
                        <div class="stat">
                            <i data-lucide="clock"></i>
                            <span>${this.formatTime(results.time)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="results-body">
                    <h3>Разбор ответов</h3>
                    <div class="results-questions">
                        ${this.currentTest.questions.map((q, i) =>
            this.renderQuestionResult(q, i, results.details[i])
        ).join('')}
                    </div>
                </div>
                
                <div class="results-footer">
                    <button class="btn btn-outline" id="retry-test">
                        <i data-lucide="rotate-ccw"></i>
                        Пройти заново
                    </button>
                    <button class="btn btn-primary" id="back-to-tests">
                        <i data-lucide="list"></i>
                        К списку тестов
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Рендер результата одного вопроса
     */
    renderQuestionResult(question, index, detail) {
        const isCorrect = detail.correct;

        return `
            <div class="result-question ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-question-header">
                    <span class="result-number">Вопрос ${index + 1}</span>
                    <span class="result-status">
                        <i data-lucide="${isCorrect ? 'check' : 'x'}"></i>
                        ${isCorrect ? 'Верно' : 'Неверно'}
                    </span>
                </div>
                <p class="result-question-text">${question.text}</p>
                
                ${!isCorrect ? `
                    <div class="result-answers">
                        <div class="result-user-answer">
                            <span class="label">Ваш ответ:</span>
                            <span class="value">${this.formatAnswer(question, detail.userAnswer)}</span>
                        </div>
                        <div class="result-correct-answer">
                            <span class="label">Правильный ответ:</span>
                            <span class="value">${this.formatAnswer(question, detail.correctAnswer)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${question.explanation ? `
                    <div class="result-explanation">
                        <i data-lucide="info"></i>
                        ${question.explanation}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Привязка обработчиков
     */
    bindEvents() {
        // Создание теста
        this.container.querySelector('#new-test-btn')?.addEventListener('click', () => {
            this.showCreateForm();
        });

        this.container.querySelector('#welcome-new-test')?.addEventListener('click', () => {
            this.showCreateForm();
        });

        // Клик по тесту в списке
        this.container.querySelector('#tests-list')?.addEventListener('click', (e) => {
            const testItem = e.target.closest('.test-item');
            const action = e.target.closest('[data-action]')?.dataset.action;

            if (!testItem) return;

            const testId = testItem.dataset.testId;
            const test = this.tests.find(t => t.id === testId);

            if (action === 'delete') {
                this.deleteTest(testId);
            } else if (action === 'start') {
                this.startTest(test);
            } else {
                this.selectTest(test);
            }
        });
    }

    /**
     * Привязка обработчиков формы создания
     */
    bindCreateFormEvents() {
        const main = document.getElementById('tests-main');

        // Слайдер количества
        const slider = main.querySelector('#question-count');
        const sliderValue = main.querySelector('#question-count-value');
        slider?.addEventListener('input', () => {
            sliderValue.textContent = slider.value;
        });

        // Закрытие формы
        main.querySelector('#close-create-form')?.addEventListener('click', () => {
            this.showWelcome();
        });

        main.querySelector('#cancel-create')?.addEventListener('click', () => {
            this.showWelcome();
        });

        // Генерация теста
        main.querySelector('#generate-test')?.addEventListener('click', () => {
            this.generateTest();
        });
    }

    /**
     * Привязка обработчиков теста
     */
    bindTestEvents() {
        const main = document.getElementById('tests-main');

        // Выбор ответа
        main.querySelectorAll('.answer-option input').forEach(input => {
            input.addEventListener('change', () => {
                this.saveAnswer();
                this.updateAnswerStyles();
            });
        });

        // Matching selects
        main.querySelectorAll('.matching-select').forEach(select => {
            select.addEventListener('change', () => {
                this.saveAnswer();
            });
        });

        // Open answer
        main.querySelector('#open-answer-input')?.addEventListener('input', (e) => {
            this.userAnswers[this.currentQuestionIndex] = e.target.value;
        });

        // Навигация
        main.querySelector('#prev-question')?.addEventListener('click', () => {
            this.prevQuestion();
        });

        main.querySelector('#next-question')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        // Точки навигации
        main.querySelectorAll('.question-dots .dot').forEach(dot => {
            dot.addEventListener('click', () => {
                this.goToQuestion(parseInt(dot.dataset.question));
            });
        });

        // Выход из теста
        main.querySelector('#exit-test')?.addEventListener('click', () => {
            this.app.modal.confirm({
                title: 'Завершить тест?',
                message: 'Прогресс будет потерян. Вы уверены?',
                confirmText: 'Завершить',
                danger: true
            }).then(confirmed => {
                if (confirmed) {
                    this.showResults();
                }
            });
        });
    }

    /**
     * Привязка обработчиков результатов
     */
    bindResultsEvents() {
        const main = document.getElementById('tests-main');

        main.querySelector('#retry-test')?.addEventListener('click', () => {
            this.startTest(this.currentTest);
        });

        main.querySelector('#back-to-tests')?.addEventListener('click', () => {
            this.currentTest = null;
            this.showWelcome();
            this.updateTestsList();
        });
    }

    /**
     * Показать форму создания
     */
    showCreateForm() {
        const main = document.getElementById('tests-main');
        main.innerHTML = this.renderCreateForm();
        this.bindCreateFormEvents();
        lucide.createIcons();
    }

    /**
     * Показать приветствие
     */
    showWelcome() {
        const main = document.getElementById('tests-main');
        main.innerHTML = this.renderWelcome();
        lucide.createIcons();

        main.querySelector('#welcome-new-test')?.addEventListener('click', () => {
            this.showCreateForm();
        });
    }

    /**
     * Генерация теста
     */
    async generateTest() {
        const main = document.getElementById('tests-main');

        // Собираем конфигурацию
        const topic = main.querySelector('#test-topic').value.trim();
        if (!topic) {
            this.app.toast.warning('Укажите тему теста');
            return;
        }

        const questionCount = parseInt(main.querySelector('#question-count').value);
        const questionTypes = Array.from(main.querySelectorAll('input[name="q-type"]:checked'))
            .map(cb => cb.value);
        const difficulty = main.querySelector('input[name="difficulty"]:checked')?.value || 'mixed';

        if (questionTypes.length === 0) {
            this.app.toast.warning('Выберите хотя бы один тип вопросов');
            return;
        }

        this.config = { topic, questionCount, questionTypes, difficulty };

        // Показываем лоадер
        main.innerHTML = `
            <div class="generation-progress">
                <div class="loader-spinner large"></div>
                <h3>Генерация теста...</h3>
                <p>Создаём ${questionCount} вопросов по теме «${topic}»</p>
            </div>
        `;

        try {
            // Проверяем API ключ
            const apiKey = this.app.storage.get('gemini_api_key');
            if (!apiKey) {
                throw new Error('Не указан API ключ Gemini. Добавьте его в настройках.');
            }

            const test = await this.callAI(this.config);

            // Сохраняем тест
            this.tests.unshift(test);
            this.saveTests();

            // Начинаем тест
            this.startTest(test);

            this.app.toast.success('Тест успешно создан!');

        } catch (error) {
            console.error('Generation error:', error);
            this.app.toast.error(error.message || 'Ошибка генерации теста');
            this.showCreateForm();
        }
    }

    /**
     * Вызов AI для генерации
     */
    async callAI(config) {
        const apiKey = this.app.storage.get('gemini_api_key');
        const profile = this.app.storage.get('user_profile') || {};

        const prompt = this.buildPrompt(config, profile);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Ошибка API');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Пустой ответ от API');
        }

        // Парсим JSON из ответа
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
            text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('Не удалось распарсить ответ');
        }

        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const testData = JSON.parse(jsonStr);

        return {
            id: this.generateId(),
            title: config.topic,
            createdAt: new Date().toISOString(),
            config: config,
            questions: testData.questions,
            lastScore: undefined
        };
    }

    /**
     * Построение промпта для генерации
     */
    buildPrompt(config, profile) {
        const typeDescriptions = {
            single: 'Вопрос с одним правильным ответом (4 варианта)',
            multiple: 'Вопрос с несколькими правильными ответами (4-5 вариантов)',
            matching: 'Вопрос на сопоставление (4-5 пар)',
            open: 'Открытый вопрос (требует текстового ответа)'
        };

        const selectedTypes = config.questionTypes
            .map(t => `- ${typeDescriptions[t]}`)
            .join('\n');

        return `Ты — генератор образовательных тестов. Создай тест по теме "${config.topic}".

ПРОФИЛЬ СТУДЕНТА:
- Уровень: ${profile.level || 'средний'}
- Глубина: ${profile.depth || 'стандартная'}
- Стиль: ${profile.style || 'практический'}

ПАРАМЕТРЫ ТЕСТА:
- Количество вопросов: ${config.questionCount}
- Сложность: ${config.difficulty}
- Типы вопросов:
${selectedTypes}

ТРЕБОВАНИЯ:
1. Вопросы должны проверять понимание, а не просто запоминание
2. Дистракторы (неправильные ответы) должны быть правдоподобными
3. Для каждого вопроса добавь краткое объяснение правильного ответа
4. Используй научную терминологию корректно
5. Равномерно распредели типы вопросов

ФОРМАТ ОТВЕТА (строго JSON):
\`\`\`json
{
  "questions": [
    {
      "type": "single",
      "text": "Текст вопроса",
      "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
      "correct": 0,
      "explanation": "Объяснение"
    },
    {
      "type": "multiple",
      "text": "Текст вопроса",
      "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
      "correct": [0, 2],
      "explanation": "Объяснение"
    },
    {
      "type": "matching",
      "text": "Сопоставьте элементы",
      "left": ["Левый 1", "Левый 2", "Левый 3"],
      "right": ["Правый 1", "Правый 2", "Правый 3"],
      "correct": {"0": 0, "1": 1, "2": 2},
      "explanation": "Объяснение"
    },
    {
      "type": "open",
      "text": "Опишите...",
      "correct": "Ключевые слова или фразы для проверки",
      "explanation": "Полный правильный ответ"
    }
  ]
}
\`\`\`

Создай ${config.questionCount} вопросов.`;
    }

    /**
     * Начать тест
     */
    startTest(test) {
        this.currentTest = test;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(test.questions.length).fill(undefined);
        this.testStartTime = Date.now();

        const main = document.getElementById('tests-main');
        main.innerHTML = this.renderTestScreen();
        this.bindTestEvents();
        lucide.createIcons();

        this.updateTestsList();
    }

    /**
     * Выбрать тест (показать детали)
     */
    selectTest(test) {
        this.currentTest = test;
        this.updateTestsList();

        const main = document.getElementById('tests-main');
        main.innerHTML = `
            <div class="test-details">
                <h2>${test.title}</h2>
                <div class="test-meta">
                    <span><i data-lucide="help-circle"></i> ${test.questions.length} вопросов</span>
                    <span><i data-lucide="calendar"></i> ${new Date(test.createdAt).toLocaleDateString('ru')}</span>
                    ${test.lastScore !== undefined ? `
                        <span><i data-lucide="trophy"></i> Лучший результат: ${test.lastScore}%</span>
                    ` : ''}
                </div>
                <div class="test-actions">
                    <button class="btn btn-primary btn-lg" id="start-selected-test">
                        <i data-lucide="play"></i>
                        Начать тест
                    </button>
                </div>
            </div>
        `;

        lucide.createIcons();

        main.querySelector('#start-selected-test')?.addEventListener('click', () => {
            this.startTest(test);
        });
    }

    /**
     * Сохранить ответ
     */
    saveAnswer() {
        const main = document.getElementById('tests-main');
        const question = this.currentTest.questions[this.currentQuestionIndex];

        switch (question.type) {
            case 'single':
                const selected = main.querySelector('input[name="answer"]:checked');
                this.userAnswers[this.currentQuestionIndex] = selected
                    ? parseInt(selected.value)
                    : undefined;
                break;

            case 'multiple':
                const checked = main.querySelectorAll('input[name="answer"]:checked');
                this.userAnswers[this.currentQuestionIndex] = Array.from(checked)
                    .map(cb => parseInt(cb.value));
                break;

            case 'matching':
                const matches = {};
                main.querySelectorAll('.matching-select').forEach(select => {
                    if (select.value) {
                        matches[select.dataset.left] = parseInt(select.value);
                    }
                });
                this.userAnswers[this.currentQuestionIndex] = matches;
                break;
        }
    }

    /**
     * Обновить стили ответов
     */
    updateAnswerStyles() {
        const main = document.getElementById('tests-main');
        main.querySelectorAll('.answer-option').forEach(option => {
            const input = option.querySelector('input');
            option.classList.toggle('selected', input.checked);
        });
    }

    /**
     * Предыдущий вопрос
     */
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.updateTestScreen();
        }
    }

    /**
     * Следующий вопрос
     */
    nextQuestion() {
        this.saveAnswer();

        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.currentQuestionIndex++;
            this.updateTestScreen();
        } else {
            this.showResults();
        }
    }

    /**
     * Перейти к вопросу
     */
    goToQuestion(index) {
        this.saveAnswer();
        this.currentQuestionIndex = index;
        this.updateTestScreen();
    }

    /**
     * Обновить экран теста
     */
    updateTestScreen() {
        const main = document.getElementById('tests-main');
        main.innerHTML = this.renderTestScreen();
        this.bindTestEvents();
        lucide.createIcons();
    }

    /**
     * Показать результаты
     */
    showResults() {
        const results = this.calculateResults();

        // Сохраняем лучший результат
        if (this.currentTest.lastScore === undefined ||
            results.percentage > this.currentTest.lastScore) {
            this.currentTest.lastScore = results.percentage;
            this.saveTests();
        }

        const main = document.getElementById('tests-main');
        main.innerHTML = this.renderResults();
        this.bindResultsEvents();
        lucide.createIcons();
    }

    /**
     * Расчёт результатов
     */
    calculateResults() {
        const details = this.currentTest.questions.map((q, i) => {
            const userAnswer = this.userAnswers[i];
            const correctAnswer = q.correct;

            let isCorrect = false;

            switch (q.type) {
                case 'single':
                    isCorrect = userAnswer === correctAnswer;
                    break;

                case 'multiple':
                    const userArr = userAnswer || [];
                    const correctArr = correctAnswer || [];
                    isCorrect = userArr.length === correctArr.length &&
                        userArr.every(a => correctArr.includes(a));
                    break;

                case 'matching':
                    const userMatches = userAnswer || {};
                    const correctMatches = correctAnswer || {};
                    isCorrect = Object.keys(correctMatches).every(
                        k => userMatches[k] === correctMatches[k]
                    );
                    break;

                case 'open':
                    // Простая проверка по ключевым словам
                    const keywords = (correctAnswer || '').toLowerCase().split(/[,;]+/);
                    const answer = (userAnswer || '').toLowerCase();
                    isCorrect = keywords.some(kw => answer.includes(kw.trim()));
                    break;
            }

            return {
                correct: isCorrect,
                userAnswer,
                correctAnswer
            };
        });

        const correct = details.filter(d => d.correct).length;
        const total = this.currentTest.questions.length;
        const percentage = Math.round((correct / total) * 100);
        const time = Date.now() - this.testStartTime;

        return { correct, total, percentage, time, details };
    }

    /**
     * Форматирование ответа для отображения
     */
    formatAnswer(question, answer) {
        if (answer === undefined || answer === null) {
            return '<em>Нет ответа</em>';
        }

        switch (question.type) {
            case 'single':
                return question.options[answer] || answer;

            case 'multiple':
                return (answer || []).map(i => question.options[i]).join(', ') || '<em>Нет ответа</em>';

            case 'matching':
                return Object.entries(answer || {})
                    .map(([l, r]) => `${question.left[l]} → ${question.right[r]}`)
                    .join('; ') || '<em>Нет ответа</em>';

            case 'open':
                return answer || '<em>Нет ответа</em>';

            default:
                return String(answer);
        }
    }

    /**
     * Удалить тест
     */
    deleteTest(testId) {
        this.app.modal.confirm({
            title: 'Удалить тест?',
            message: 'Это действие нельзя отменить.',
            confirmText: 'Удалить',
            danger: true
        }).then(confirmed => {
            if (confirmed) {
                this.tests = this.tests.filter(t => t.id !== testId);
                this.saveTests();
                this.updateTestsList();

                if (this.currentTest?.id === testId) {
                    this.currentTest = null;
                    this.showWelcome();
                }

                this.app.toast.success('Тест удалён');
            }
        });
    }

    /**
     * Обновить список тестов
     */
    updateTestsList() {
        const list = document.getElementById('tests-list');
        if (list) {
            list.innerHTML = this.renderTestsList();
            lucide.createIcons();
        }
    }

    /**
     * Сохранить тесты
     */
    saveTests() {
        this.app.storage.set('tests', this.tests);
    }

    /**
     * Вспомогательные методы
     */
    generateId() {
        return 'test_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getQuestionTypeName(type) {
        const names = {
            single: 'Один ответ',
            multiple: 'Несколько ответов',
            matching: 'Сопоставление',
            open: 'Открытый ответ'
        };
        return names[type] || type;
    }

    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'average';
        return 'poor';
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}