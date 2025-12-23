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
                <!-- Основная область (слева) -->
                <main class="cards-main">
                    ${this.currentDeck 
                        ? this.renderDeckContent()
                        : this.renderCardsWelcome()}
                </main>
                
                <!-- Сайдбар с колодами (справа) -->
                <aside class="decks-sidebar">
                    <div class="sidebar-header">
                        <h2>Колоды</h2>
                        <div class="sidebar-actions">
                            <button class="btn-icon" id="create-deck-btn" title="Новая колода">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="decks-list" id="decks-list">
                        ${this.renderDecksList(decks)}
                    </div>
                    
                    <div class="sidebar-footer">
                        <button class="btn btn-primary btn-block" id="generate-deck-btn">
                            <i data-lucide="sparkles"></i>
                            <span>Сгенерировать</span>
                        </button>
                    </div>
                </aside>
            </div>
            
            ${this.renderCreateDeckModal()}
            ${this.renderGenerateModal()}
            ${this.renderEditCardModal()}
        `;
    }
    
    renderCardsWelcome() {
        return `
            <div class="cards-welcome">
                <div class="welcome-illustration">
                    <i data-lucide="layers"></i>
                </div>
                <h2>Карточки для запоминания</h2>
                <p>Выберите колоду из списка справа или создайте новую</p>
                
                <!-- Статистика -->
                ${this.renderTodayStats()}
                
                <div class="welcome-actions">
                    <button class="btn btn-primary" id="welcome-create-deck">
                        <i data-lucide="plus"></i>
                        <span>Создать колоду</span>
                    </button>
                    <button class="btn btn-outline" id="welcome-generate">
                        <i data-lucide="sparkles"></i>
                        <span>Сгенерировать</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderDeckContent() {
        const deck = this.currentDeck;
        const cards = this.app.storage.get('cards') || [];
        const deckCards = cards.filter(c => c.deckId === deck.id);
        const stats = this.getDeckStats(deckCards);
        
        return `
            <div class="deck-content">
                <!-- Заголовок колоды -->
                <div class="deck-header-main">
                    <div class="deck-info">
                        <div class="deck-color-badge" style="background: ${deck.color || 'var(--color-primary)'}"></div>
                        <div>
                            <h1 class="deck-title-main">${deck.name}</h1>
                            <p class="deck-description-main">${deck.description || 'Нет описания'}</p>
                        </div>
                    </div>
                    <div class="deck-actions-main">
                        <button class="btn btn-primary" id="start-study-btn" ${deckCards.length === 0 ? 'disabled' : ''}>
                            <i data-lucide="play"></i>
                            <span>Учить</span>
                        </button>
                        <button class="btn btn-outline" id="add-card-btn">
                            <i data-lucide="plus"></i>
                            <span>Добавить</span>
                        </button>
                        <button class="btn-icon" id="deck-menu-btn" title="Действия">
                            <i data-lucide="more-vertical"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Статистика колоды -->
                <div class="deck-stats-main">
                    <div class="stat-item">
                        <span class="stat-number">${stats.total}</span>
                        <span class="stat-label">Всего</span>
                    </div>
                    <div class="stat-item due">
                        <span class="stat-number">${stats.due}</span>
                        <span class="stat-label">К повторению</span>
                    </div>
                    <div class="stat-item new">
                        <span class="stat-number">${stats.new}</span>
                        <span class="stat-label">Новых</span>
                    </div>
                </div>
                
                <!-- Список карточек -->
                <div class="cards-list-section">
                    <div class="section-header">
                        <h3>Карточки</h3>
                        <div class="section-actions">
                            <input type="search" class="search-input" id="cards-search" placeholder="Поиск...">
                        </div>
                    </div>
                    
                    ${deckCards.length === 0 
                        ? this.renderEmptyDeck()
                        : this.renderCardsList(deckCards)}
                </div>
            </div>
        `;
    }
    
    renderDecksList(decks) {
        if (decks.length === 0) {
            return `
                <div class="decks-empty">
                    <i data-lucide="inbox"></i>
                    <p>Нет колод</p>
                </div>
            `;
        }
        
        const cards = this.app.storage.get('cards') || [];
        
        return decks.map(deck => {
            const deckCards = cards.filter(c => c.deckId === deck.id);
            const stats = this.getDeckStats(deckCards);
            const isActive = this.currentDeck?.id === deck.id;
            
            return `
                <div class="deck-item ${isActive ? 'active' : ''}" data-deck-id="${deck.id}">
                    <div class="deck-item-color" style="background: ${deck.color || 'var(--color-primary)'}"></div>
                    <div class="deck-item-content">
                        <span class="deck-item-name">${deck.name}</span>
                        <span class="deck-item-stats">
                            <span class="due">${stats.due}</span> · 
                            <span class="new">${stats.new}</span> · 
                            <span>${stats.total}</span>
                        </span>
                    </div>
                    <button class="btn-icon deck-item-menu" data-deck-id="${deck.id}">
                        <i data-lucide="more-vertical"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    renderEmptyDeck() {
        return `
            <div class="empty-deck">
                <i data-lucide="file-plus"></i>
                <p>В колоде пока нет карточек</p>
                <button class="btn btn-primary" id="empty-add-card">
                    <i data-lucide="plus"></i>
                    Добавить карточку
                </button>
            </div>
        `;
    }
    
    renderCardsList(cards) {
        return `
            <div class="cards-grid">
                ${cards.map(card => `
                    <div class="card-item" data-card-id="${card.id}">
                        <div class="card-item-front">${this.truncateText(card.front, 100)}</div>
                        <div class="card-item-back">${this.truncateText(card.back, 80)}</div>
                        <div class="card-item-actions">
                            <button class="btn-icon card-edit" data-card-id="${card.id}" title="Редактировать">
                                <i data-lucide="edit-2"></i>
                            </button>
                            <button class="btn-icon card-delete" data-card-id="${card.id}" title="Удалить">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    renderTodayStats() {
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
            if (card.fsrs?.state === 2) learned++;
        });
        
        return `
            <div class="today-stats-compact">
                <div class="stat-item">
                    <i data-lucide="clock"></i>
                    <span class="stat-value due">${dueToday}</span>
                    <span class="stat-label">к повторению</span>
                </div>
                <div class="stat-item">
                    <i data-lucide="sparkle"></i>
                    <span class="stat-value new">${newCards}</span>
                    <span class="stat-label">новых</span>
                </div>
                <div class="stat-item">
                    <i data-lucide="check-circle"></i>
                    <span class="stat-value">${learned}</span>
                    <span class="stat-label">изучено</span>
                </div>
                <div class="stat-item">
                    <i data-lucide="layers"></i>
                    <span class="stat-value">${cards.length}</span>
                    <span class="stat-label">всего</span>
                </div>
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
                <div class="modal-container">
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
                <div class="modal-container modal-large">
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
                <div class="modal-container">
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
        
        container.querySelector('#welcome-create-deck')?.addEventListener('click', () => {
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
        
        container.querySelector('#welcome-generate')?.addEventListener('click', () => {
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
        
        // Клик по колоде в sidebar
        container.querySelectorAll('.deck-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.deck-item-menu')) {
                    const deckId = item.dataset.deckId;
                    this.selectDeck(deckId);
                }
            });
        });
        
        // Изучение выбранной колоды
        container.querySelector('#start-study-btn')?.addEventListener('click', () => {
            if (this.currentDeck) {
                this.startReview(this.currentDeck.id);
            }
        });
        
        // Добавление карточки
        container.querySelector('#add-card-btn')?.addEventListener('click', () => {
            this.openAddCardModal();
        });
        
        container.querySelector('#empty-add-card')?.addEventListener('click', () => {
            this.openAddCardModal();
        });
        
        // Редактирование карточек
        container.querySelectorAll('.card-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editCard(btn.dataset.cardId);
            });
        });
        
        // Удаление карточек
        container.querySelectorAll('.card-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCard(btn.dataset.cardId);
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
        this.reviewQueue = [];
        this.render(document.getElementById('main-content'));
    }
    
    selectDeck(deckId) {
        const decks = this.app.storage.get('decks') || [];
        this.currentDeck = decks.find(d => d.id === deckId);
        this.render(document.getElementById('main-content'));
    }
    
    openAddCardModal() {
        if (!this.currentDeck) return;
        
        // Очищаем поля
        const frontInput = document.getElementById('card-front');
        const backInput = document.getElementById('card-back');
        if (frontInput) frontInput.value = '';
        if (backInput) backInput.value = '';
        
        // Меняем заголовок
        const modalTitle = document.querySelector('#edit-card-modal .modal-header h3');
        if (modalTitle) modalTitle.textContent = 'Новая карточка';
        
        // Устанавливаем режим добавления
        this.editingCardId = null;
        
        this.app.modal.open('edit-card-modal');
    }
    
    editCard(cardId) {
        const cards = this.app.storage.get('cards') || [];
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        const frontInput = document.getElementById('card-front');
        const backInput = document.getElementById('card-back');
        if (frontInput) frontInput.value = card.front || '';
        if (backInput) backInput.value = card.back || '';
        
        const modalTitle = document.querySelector('#edit-card-modal .modal-header h3');
        if (modalTitle) modalTitle.textContent = 'Редактировать карточку';
        
        this.editingCardId = cardId;
        
        this.app.modal.open('edit-card-modal');
    }
    
    deleteCard(cardId) {
        this.app.modal.confirm({
            title: 'Удалить карточку?',
            message: 'Это действие нельзя отменить.',
            confirmText: 'Удалить',
            isDanger: true,
            onConfirm: () => {
                const cards = this.app.storage.get('cards') || [];
                const filtered = cards.filter(c => c.id !== cardId);
                this.app.storage.set('cards', filtered);
                this.render(document.getElementById('main-content'));
                this.app.toast.success('Карточка удалена');
            }
        });
    }
    
    browseDeck(deckId) {
        this.selectDeck(deckId);
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
