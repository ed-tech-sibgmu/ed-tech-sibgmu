/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CardsPage — Страница карточек для интервального повторения
 * FSRS алгоритм + колоды + статистика
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class CardsPage {
    constructor(app) {
        this.app = app;
        this.currentDeck = null;
        this.currentCard = null;
        this.reviewMode = false;
        this.reviewQueue = [];
        this.reviewIndex = 0;
        this.showAnswer = false;
        this.sessionStats = { correct: 0, wrong: 0, total: 0 };
    }
    
    render(container) {
        if (this.reviewMode && this.currentDeck) {
            container.innerHTML = this.renderReviewMode();
        } else {
            container.innerHTML = this.renderDeckList();
        }
        
        this.initEvents(container);
    }
    
    renderDeckList() {
        const decks = this.app.storage.get('decks') || [];
        
        return `
            <div class="page cards-page">
                <header class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">Карточки</h1>
                        <p class="page-subtitle">Интервальное повторение с алгоритмом FSRS</p>
                    </div>
                    <button class="btn btn-primary" id="create-deck-btn">
                        <i data-lucide="plus"></i>
                        <span>Новая колода</span>
                    </button>
                </header>
                
                <!-- Статистика на сегодня -->
                ${this.renderTodayStats()}
                
                <!-- Список колод -->
                <section class="decks-section">
                    ${decks.length === 0 
                        ? this.renderEmptyDecks()
                        : this.renderDecks(decks)}
                </section>
                
                <!-- Быстрая генерация -->
                <section class="generate-section">
                    <div class="generate-card">
                        <div class="generate-icon">
                            <i data-lucide="sparkles"></i>
                        </div>
                        <div class="generate-content">
                            <h3>Сгенерировать карточки</h3>
                            <p>Используйте ИИ для автоматического создания карточек по теме</p>
                        </div>
                        <button class="btn btn-outline" id="generate-deck-btn">
                            <i data-lucide="wand-2"></i>
                            <span>Сгенерировать</span>
                        </button>
                    </div>
                </section>
            </div>
            
            ${this.renderCreateDeckModal()}
            ${this.renderGenerateModal()}
            ${this.renderEditCardModal()}
        `;
    }
    
    renderTodayStats() {
        const decks = this.app.storage.get('decks') || [];
        const cards = this.app.storage.get('cards') || [];
        
        let dueToday = 0;
        let newCards = 0;
        let learned = 0;
        
        const now = new Date();
        
        cards.forEach(card => {
            if (!card.fsrs) {
                newCards++;
            } else if (new Date(card.fsrs.due) <= now) {
                dueToday++;
            }
            if (card.fsrs?.state === 2) learned++; // Review state
        });
        
        return `
            <div class="today-stats">
                <div class="today-stat">
                    <span class="stat-number due">${dueToday}</span>
                    <span class="stat-label">К повторению</span>
                </div>
                <div class="today-stat">
                    <span class="stat-number new">${newCards}</span>
                    <span class="stat-label">Новых</span>
                </div>
                <div class="today-stat">
                    <span class="stat-number learned">${learned}</span>
                    <span class="stat-label">Изучено</span>
                </div>
                <div class="today-stat">
                    <span class="stat-number total">${cards.length}</span>
                    <span class="stat-label">Всего</span>
                </div>
            </div>
        `;
    }
    
    renderEmptyDecks() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i data-lucide="layers"></i>
                </div>
                <h3>Нет колод</h3>
                <p>Создайте первую колоду карточек или сгенерируйте с помощью ИИ</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" id="empty-create-deck">
                        <i data-lucide="plus"></i>
                        <span>Создать колоду</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderDecks(decks) {
        const cards = this.app.storage.get('cards') || [];
        
        return `
            <div class="decks-grid">
                ${decks.map(deck => {
                    const deckCards = cards.filter(c => c.deckId === deck.id);
                    const stats = this.getDeckStats(deckCards);
                    
                    return `
                        <article class="deck-card" data-deck-id="${deck.id}">
                            <div class="deck-header">
                                <div class="deck-color" style="background: ${deck.color || 'var(--accent)'}"></div>
                                <h3 class="deck-title">${deck.name}</h3>
                                <button class="btn-icon deck-menu" data-deck-id="${deck.id}">
                                    <i data-lucide="more-vertical"></i>
                                </button>
                            </div>
                            <p class="deck-description">${deck.description || 'Нет описания'}</p>
                            <div class="deck-stats">
                                <span class="deck-stat due" title="К повторению">
                                    <i data-lucide="clock"></i> ${stats.due}
                                </span>
                                <span class="deck-stat new" title="Новые">
                                    <i data-lucide="sparkle"></i> ${stats.new}
                                </span>
                                <span class="deck-stat total" title="Всего">
                                    <i data-lucide="layers"></i> ${stats.total}
                                </span>
                            </div>
                            <div class="deck-actions">
                                <button class="btn btn-primary btn-sm deck-study" data-deck-id="${deck.id}">
                                    <i data-lucide="play"></i>
                                    Учить
                                </button>
                                <button class="btn btn-outline btn-sm deck-browse" data-deck-id="${deck.id}">
                                    <i data-lucide="list"></i>
                                    Обзор
                                </button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    getDeckStats(cards) {
        const now = new Date();
        let due = 0, newCount = 0;
        
        cards.forEach(card => {
            if (!card.fsrs) {
                newCount++;
            } else if (new Date(card.fsrs.due) <= now) {
                due++;
            }
        });
        
        return { due, new: newCount, total: cards.length };
    }
    
    renderReviewMode() {
        if (this.reviewQueue.length === 0) {
            return this.renderReviewComplete();
        }
        
        const card = this.reviewQueue[this.reviewIndex];
        const progress = ((this.reviewIndex) / this.reviewQueue.length) * 100;
        
        return `
            <div class="page review-page">
                <!-- Header -->
                <header class="review-header">
                    <button class="btn-icon" id="exit-review">
                        <i data-lucide="x"></i>
                    </button>
                    <div class="review-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${this.reviewIndex + 1} / ${this.reviewQueue.length}</span>
                    </div>
                    <div class="review-session-stats">
                        <span class="correct">${this.sessionStats.correct}</span>
                        <span class="wrong">${this.sessionStats.wrong}</span>
                    </div>
                </header>
                
                <!-- Карточка -->
                <div class="review-card-container">
                    <div class="flashcard ${this.showAnswer ? 'flipped' : ''}" id="flashcard">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <div class="card-content">
                                    ${this.renderCardContent(card.front)}
                                </div>
                                <button class="btn btn-primary show-answer-btn" id="show-answer">
                                    Показать ответ
                                </button>
                            </div>
                            <div class="flashcard-back">
                                <div class="card-content">
                                    ${this.renderCardContent(card.back)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Кнопки оценки -->
                <div class="rating-buttons ${this.showAnswer ? 'visible' : ''}">
                    <button class="rating-btn again" data-rating="1">
                        <span class="rating-label">Снова</span>
                        <span class="rating-interval">${this.getIntervalText(card, 1)}</span>
                    </button>
                    <button class="rating-btn hard" data-rating="2">
                        <span class="rating-label">Трудно</span>
                        <span class="rating-interval">${this.getIntervalText(card, 2)}</span>
                    </button>
                    <button class="rating-btn good" data-rating="3">
                        <span class="rating-label">Хорошо</span>
                        <span class="rating-interval">${this.getIntervalText(card, 3)}</span>
                    </button>
                    <button class="rating-btn easy" data-rating="4">
                        <span class="rating-label">Легко</span>
                        <span class="rating-interval">${this.getIntervalText(card, 4)}</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderReviewComplete() {
        const total = this.sessionStats.total;
        const correct = this.sessionStats.correct;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        return `
            <div class="page review-complete-page">
                <div class="complete-card">
                    <div class="complete-icon">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <h2>Отлично!</h2>
                    <p>Вы завершили изучение колоды "${this.currentDeck?.name}"</p>
                    
                    <div class="complete-stats">
                        <div class="complete-stat">
                            <span class="stat-value">${total}</span>
                            <span class="stat-label">Карточек</span>
                        </div>
                        <div class="complete-stat">
                            <span class="stat-value">${correct}</span>
                            <span class="stat-label">Правильно</span>
                        </div>
                        <div class="complete-stat">
                            <span class="stat-value">${accuracy}%</span>
                            <span class="stat-label">Точность</span>
                        </div>
                    </div>
                    
                    <div class="complete-actions">
                        <button class="btn btn-primary" id="finish-review">
                            <i data-lucide="home"></i>
                            <span>К колодам</span>
                        </button>
                        <button class="btn btn-outline" id="review-again">
                            <i data-lucide="rotate-ccw"></i>
                            <span>Ещё раз</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderCardContent(content) {
        if (!content) return '';
        
        // Markdown + LaTeX
        let html = marked.parse(content);
        
        // LaTeX
        html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
            try {
                return katex.renderToString(tex.trim(), { displayMode: true });
            } catch (e) {
                return `<span class="latex-error">${tex}</span>`;
            }
        });
        
        html = html.replace(/\$([^\$]+?)\$/g, (match, tex) => {
            try {
                return katex.renderToString(tex.trim(), { displayMode: false });
            } catch (e) {
                return `<span class="latex-error">${tex}</span>`;
            }
        });
        
        return html;
    }
    
    getIntervalText(card, rating) {
        const intervals = this.calculateNextIntervals(card);
        const interval = intervals[rating];
        
        if (interval < 60) return `${Math.round(interval)} мин`;
        if (interval < 1440) return `${Math.round(interval / 60)} ч`;
        return `${Math.round(interval / 1440)} д`;
    }
    
    calculateNextIntervals(card) {
        // Упрощённый FSRS алгоритм
        const fsrs = card.fsrs || { stability: 1, difficulty: 5, state: 0 };
        
        const baseIntervals = {
            1: 1,      // Again: 1 минута
            2: 10,     // Hard: 10 минут
            3: 1440,   // Good: 1 день
            4: 4320    // Easy: 3 дня
        };
        
        if (fsrs.state === 0) {
            // Новая карточка
            return baseIntervals;
        }
        
        // Для изученных карточек
        const multipliers = { 1: 0, 2: 0.8, 3: 1, 4: 1.3 };
        const stability = fsrs.stability || 1;
        
        return {
            1: 10,
            2: Math.max(1440, stability * multipliers[2] * 1440),
            3: Math.max(1440, stability * multipliers[3] * 1440),
            4: Math.max(1440, stability * multipliers[4] * 1440)
        };
    }
    
    renderCreateDeckModal() {
        return `
            <div class="modal" id="create-deck-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Новая колода</h3>
                        <button class="modal-close" data-close="create-deck-modal">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Название</label>
                            <input type="text" class="form-input" id="deck-name" placeholder="Например: Анатомия сердца">
                        </div>
                        <div class="form-group">
                            <label>Описание (опционально)</label>
                            <textarea class="form-input form-textarea" id="deck-description" placeholder="Краткое описание колоды"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Цвет</label>
                            <div class="color-picker">
                                <button class="color-option active" data-color="#8B5CF6" style="background: #8B5CF6"></button>
                                <button class="color-option" data-color="#14B8A6" style="background: #14B8A6"></button>
                                <button class="color-option" data-color="#3B82F6" style="background: #3B82F6"></button>
                                <button class="color-option" data-color="#F97316" style="background: #F97316"></button>
                                <button class="color-option" data-color="#EC4899" style="background: #EC4899"></button>
                                <button class="color-option" data-color="#EF4444" style="background: #EF4444"></button>
                                <button class="color-option" data-color="#EAB308" style="background: #EAB308"></button>
                                <button class="color-option" data-color="#84CC16" style="background: #84CC16"></button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" data-close="create-deck-modal">Отмена</button>
                        <button class="btn btn-primary" id="save-deck">Создать</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderGenerateModal() {
        return `
            <div class="modal" id="generate-cards-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>Генерация карточек</h3>
                        <button class="modal-close" data-close="generate-cards-modal">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Тема</label>
                            <input type="text" class="form-input" id="generate-cards-topic" placeholder="Например: Цикл Кребса">
                        </div>
                        <div class="form-group">
                            <label>Количество карточек</label>
                            <div class="slider-group">
                                <input type="range" class="form-slider" id="cards-count" min="5" max="50" step="5" value="15">
                                <span class="slider-value" id="cards-count-value">15</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Тип карточек</label>
                            <div class="checkbox-group">
                                <label class="checkbox-option">
                                    <input type="checkbox" name="card-type" value="definition" checked>
                                    <span>Определения</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" name="card-type" value="question">
                                    <span>Вопрос-ответ</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" name="card-type" value="completion">
                                    <span>Дополнение</span>
                                </label>
                            </div>
                        </div>
                        <div class="generate-progress hidden" id="generate-cards-progress">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <span class="progress-text">Генерация карточек...</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" data-close="generate-cards-modal">Отмена</button>
                        <button class="btn btn-primary" id="start-generate-cards">
                            <i data-lucide="sparkles"></i>
                            <span>Сгенерировать</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderEditCardModal() {
        return `
            <div class="modal" id="edit-card-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Редактировать карточку</h3>
                        <button class="modal-close" data-close="edit-card-modal">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Лицевая сторона</label>
                            <textarea class="form-input form-textarea" id="card-front" placeholder="Вопрос или термин"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Обратная сторона</label>
                            <textarea class="form-input form-textarea" id="card-back" placeholder="Ответ или определение"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" data-close="edit-card-modal">Отмена</button>
                        <button class="btn btn-primary" id="save-card">Сохранить</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    initEvents(container) {
        // Создание колоды
        container.querySelector('#create-deck-btn')?.addEventListener('click', () => {
            this.app.modal.open('create-deck-modal');
        });
        
        container.querySelector('#empty-create-deck')?.addEventListener('click', () => {
            this.app.modal.open('create-deck-modal');
        });
        
        container.querySelector('#save-deck')?.addEventListener('click', () => {
            this.createDeck();
        });
        
        // Выбор цвета
        container.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Генерация
        container.querySelector('#generate-deck-btn')?.addEventListener('click', () => {
            this.app.modal.open('generate-cards-modal');
        });
        
        container.querySelector('#start-generate-cards')?.addEventListener('click', () => {
            this.generateCards();
        });
        
        // Слайдер количества
        const slider = container.querySelector('#cards-count');
        const sliderValue = container.querySelector('#cards-count-value');
        slider?.addEventListener('input', () => {
            if (sliderValue) sliderValue.textContent = slider.value;
        });
        
        // Изучение колоды
        container.querySelectorAll('.deck-study').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startReview(btn.dataset.deckId);
            });
        });
        
        // Обзор колоды
        container.querySelectorAll('.deck-browse').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.browseDeck(btn.dataset.deckId);
            });
        });
        
        // Режим повторения
        container.querySelector('#show-answer')?.addEventListener('click', () => {
            this.showAnswer = true;
            this.render(document.getElementById('main-content'));
        });
        
        container.querySelector('#flashcard')?.addEventListener('click', () => {
            if (!this.showAnswer) {
                this.showAnswer = true;
                this.render(document.getElementById('main-content'));
            }
        });
        
        container.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rating = parseInt(btn.dataset.rating);
                this.rateCard(rating);
            });
        });
        
        container.querySelector('#exit-review')?.addEventListener('click', () => {
            this.exitReview();
        });
        
        container.querySelector('#finish-review')?.addEventListener('click', () => {
            this.exitReview();
        });
        
        container.querySelector('#review-again')?.addEventListener('click', () => {
            this.startReview(this.currentDeck.id);
        });
        
        // Закрытие модалок
        container.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.app.modal.close(btn.dataset.close);
            });
        });
        
        container.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.app.modal.close(modal.id);
            });
        });
        
        // Горячие клавиши в режиме повторения
        if (this.reviewMode) {
            this.initKeyboardShortcuts();
        }
    }
    
    initKeyboardShortcuts() {
        const handler = (e) => {
            if (!this.reviewMode) {
                document.removeEventListener('keydown', handler);
                return;
            }
            
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!this.showAnswer) {
                    this.showAnswer = true;
                    this.render(document.getElementById('main-content'));
                }
            } else if (this.showAnswer) {
                const keyMap = { '1': 1, '2': 2, '3': 3, '4': 4 };
                if (keyMap[e.key]) {
                    e.preventDefault();
                    this.rateCard(keyMap[e.key]);
                }
            }
            
            if (e.key === 'Escape') {
                this.exitReview();
            }
        };
        
        document.addEventListener('keydown', handler);
    }
    
    createDeck() {
        const name = document.getElementById('deck-name')?.value.trim();
        const description = document.getElementById('deck-description')?.value.trim();
        const colorBtn = document.querySelector('.color-option.active');
        const color = colorBtn?.dataset.color || '#8B5CF6';
        
        if (!name) {
            this.app.toast.warning('Введите название колоды');
            return;
        }
        
        const deck = {
            id: this.generateId(),
            name,
            description,
            color,
            createdAt: new Date().toISOString()
        };
        
        const decks = this.app.storage.get('decks') || [];
        decks.push(deck);
        this.app.storage.set('decks', decks);
        
        this.app.modal.close('create-deck-modal');
        this.render(document.getElementById('main-content'));
        this.app.toast.success('Колода создана');
    }
    
    startReview(deckId) {
        const decks = this.app.storage.get('decks') || [];
        const cards = this.app.storage.get('cards') || [];
        
        this.currentDeck = decks.find(d => d.id === deckId);
        if (!this.currentDeck) return;
        
        const deckCards = cards.filter(c => c.deckId === deckId);
        
        // Фильтруем карточки для повторения (новые + due)
        const now = new Date();
        this.reviewQueue = deckCards.filter(card => {
            if (!card.fsrs) return true; // Новая
            return new Date(card.fsrs.due) <= now;
        });
        
        // Перемешиваем
        this.reviewQueue = this.shuffleArray([...this.reviewQueue]);
        
        if (this.reviewQueue.length === 0) {
            this.app.toast.info('Все карточки повторены!');
            return;
        }
        
        this.reviewMode = true;
        this.reviewIndex = 0;
        this.showAnswer = false;
        this.sessionStats = { correct: 0, wrong: 0, total: 0 };
        
        this.render(document.getElementById('main-content'));
    }
    
    rateCard(rating) {
        const card = this.reviewQueue[this.reviewIndex];
        
        // Обновляем FSRS данные
        const intervals = this.calculateNextIntervals(card);
        const intervalMinutes = intervals[rating];
        
        card.fsrs = card.fsrs || { stability: 1, difficulty: 5, state: 0, reps: 0 };
        card.fsrs.due = new Date(Date.now() + intervalMinutes * 60000).toISOString();
        card.fsrs.reps++;
        
        // Обновляем параметры
        if (rating >= 3) {
            card.fsrs.stability = Math.min(card.fsrs.stability * 1.2, 365);
            card.fsrs.state = 2; // Review
            this.sessionStats.correct++;
        } else {
            card.fsrs.stability = Math.max(card.fsrs.stability * 0.5, 1);
            if (rating === 1) card.fsrs.state = 1; // Learning
            this.sessionStats.wrong++;
        }
        
        this.sessionStats.total++;
        
        // Сохраняем
        const cards = this.app.storage.get('cards') || [];
        const index = cards.findIndex(c => c.id === card.id);
        if (index !== -1) {
            cards[index] = card;
            this.app.storage.set('cards', cards);
        }
        
        // Следующая карточка
        this.reviewIndex++;
        this.showAnswer = false;
        
        this.render(document.getElementById('main-content'));
    }
    
    exitReview() {
        this.reviewMode = false;
        this.currentDeck = null;
        this.reviewQueue = [];
        this.render(document.getElementById('main-content'));
    }
    
    browseDeck(deckId) {
        // TODO: Реализовать просмотр карточек колоды
        this.app.toast.info('Функция в разработке');
    }
    
    async generateCards() {
        const topic = document.getElementById('generate-cards-topic')?.value.trim();
        const count = parseInt(document.getElementById('cards-count')?.value || '15');
        
        if (!topic) {
            this.app.toast.warning('Введите тему');
            return;
        }
        
        const apiKey = this.app.storage.get('gemini_api_key') || this.app.storage.get('anthropic_api_key');
        if (!apiKey) {
            this.app.toast.error('Добавьте API ключ в настройках');
            return;
        }
        
        const progress = document.getElementById('generate-cards-progress');
        progress?.classList.remove('hidden');
        
        const btn = document.getElementById('start-generate-cards');
        if (btn) btn.disabled = true;
        
        try {
            const profile = this.app.storage.get('user_profile') || {};
            const generatedCards = await this.callGeminiAPI(apiKey, topic, count, profile);
            
            // Создаём колоду
            const deck = {
                id: this.generateId(),
                name: topic,
                description: `Автоматически сгенерированные карточки по теме "${topic}"`,
                color: '#8B5CF6',
                createdAt: new Date().toISOString()
            };
            
            const decks = this.app.storage.get('decks') || [];
            decks.push(deck);
            this.app.storage.set('decks', decks);
            
            // Добавляем карточки
            const cards = this.app.storage.get('cards') || [];
            generatedCards.forEach(c => {
                cards.push({
                    id: this.generateId(),
                    deckId: deck.id,
                    front: c.front,
                    back: c.back,
                    createdAt: new Date().toISOString()
                });
            });
            this.app.storage.set('cards', cards);
            
            this.app.modal.close('generate-cards-modal');
            this.render(document.getElementById('main-content'));
            this.app.toast.success(`Создано ${generatedCards.length} карточек!`);
            
        } catch (error) {
            console.error('Generate error:', error);
            this.app.toast.error('Ошибка генерации: ' + error.message);
        } finally {
            progress?.classList.add('hidden');
            if (btn) btn.disabled = false;
        }
    }
    
    async callGeminiAPI(apiKey, topic, count, profile) {
        const prompt = `Создай ${count} карточек для запоминания по теме "${topic}".

Профиль пользователя:
- Уровень: ${profile.level || 'средний'}
- Глубина: ${profile.depth || 'стандартная'}
- Стиль: ${profile.style || 'практический'}

Верни JSON массив в формате:
[{"front": "вопрос или термин", "back": "ответ или определение"}]

Только JSON, без дополнительного текста.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка API');
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Парсим JSON
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('Не удалось распарсить ответ');
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
