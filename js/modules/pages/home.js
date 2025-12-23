/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HomePage — Главная страница с выбором модулей
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class HomePage {
    constructor(app) {
        this.app = app;
    }
    
    render(container) {
        const profile = this.app.storage.get('user_profile') || {};
        const stats = this.getStats();
        
        container.innerHTML = `
            <div class="page home-page">
                <!-- Заголовок -->
                <header class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">Добро пожаловать!</h1>
                        <p class="page-subtitle">
                            ${profile.topic 
                                ? `Предметная область: <strong>${profile.topic}</strong>` 
                                : 'Выберите модуль для начала работы'}
                        </p>
                    </div>
                    <button class="btn btn-outline profile-quick-btn" id="quick-profile">
                        <i data-lucide="user"></i>
                        <span>Профиль</span>
                    </button>
                </header>
                
                <!-- Быстрая статистика -->
                <div class="quick-stats">
                    <div class="stat-card">
                        <div class="stat-icon notes">
                            <i data-lucide="file-text"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.notes}</span>
                            <span class="stat-label">Конспектов</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon cards">
                            <i data-lucide="layers"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.cards}</span>
                            <span class="stat-label">Карточек</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon tests">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.tests}</span>
                            <span class="stat-label">Тестов</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon streak">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.streak}</span>
                            <span class="stat-label">Дней подряд</span>
                        </div>
                    </div>
                </div>
                
                <!-- Основной контент: модули + история -->
                <div class="home-content">
                    <!-- Модули -->
                    <section class="modules-section">
                        <h2 class="section-title">Модули обучения</h2>
                        <div class="modules-grid">
                            <!-- Конспекты -->
                            <article class="module-card notes" data-module="notes">
                                <div class="module-icon">
                                    <i data-lucide="book-open"></i>
                                </div>
                                <div class="module-content">
                                    <h3 class="module-title">Конспекты</h3>
                                    <p class="module-description">
                                        Структурированные заметки с поддержкой Markdown и LaTeX. 
                                        Организуйте знания в удобную файловую систему.
                                    </p>
                                    <div class="module-features">
                                        <span class="feature-tag"><i data-lucide="file-text"></i> Markdown</span>
                                        <span class="feature-tag"><i data-lucide="sigma"></i> LaTeX</span>
                                        <span class="feature-tag"><i data-lucide="folder-tree"></i> Папки</span>
                                    </div>
                                </div>
                                <div class="module-action">
                                    <i data-lucide="arrow-right"></i>
                                </div>
                            </article>
                            
                            <!-- Карточки -->
                            <article class="module-card cards" data-module="cards">
                                <div class="module-icon">
                                    <i data-lucide="layers"></i>
                                </div>
                                <div class="module-content">
                                    <h3 class="module-title">Карточки</h3>
                                    <p class="module-description">
                                        Интервальное повторение с алгоритмом FSRS. 
                                        Запоминайте эффективно с научным подходом.
                                    </p>
                                    <div class="module-features">
                                        <span class="feature-tag"><i data-lucide="brain"></i> FSRS</span>
                                        <span class="feature-tag"><i data-lucide="image"></i> Медиа</span>
                                        <span class="feature-tag"><i data-lucide="bar-chart-2"></i> Статистика</span>
                                    </div>
                                </div>
                                <div class="module-action">
                                    <i data-lucide="arrow-right"></i>
                                </div>
                            </article>
                            
                            <!-- Тесты -->
                            <article class="module-card tests" data-module="tests">
                                <div class="module-icon">
                                    <i data-lucide="clipboard-check"></i>
                                </div>
                                <div class="module-content">
                                    <h3 class="module-title">Тесты</h3>
                                    <p class="module-description">
                                        Проверьте свои знания с помощью разнообразных типов вопросов. 
                                        Отслеживайте прогресс и находите слабые места.
                                    </p>
                                    <div class="module-features">
                                        <span class="feature-tag"><i data-lucide="list-checks"></i> Выбор</span>
                                        <span class="feature-tag"><i data-lucide="link"></i> Соответствие</span>
                                        <span class="feature-tag"><i data-lucide="pen-tool"></i> Открытые</span>
                                    </div>
                                </div>
                                <div class="module-action">
                                    <i data-lucide="arrow-right"></i>
                                </div>
                            </article>
                        </div>
                    </section>
                    
                    <!-- История (для больших экранов) -->
                    <aside class="history-sidebar">
                        ${this.renderRecentActivity()}
                    </aside>
                </div>
            </div>
        `;
        
        this.initEvents(container);
    }
    
    getStats() {
        const notes = this.app.storage.get('notes') || [];
        const cards = this.app.storage.get('cards') || [];
        const tests = this.app.storage.get('tests') || [];
        const streak = this.app.storage.get('streak') || 0;
        
        return {
            notes: notes.length,
            cards: cards.length,
            tests: tests.length,
            streak: streak
        };
    }
    
    renderRecentActivity() {
        const notes = this.app.storage.get('notes') || [];
        const recentNotes = notes.slice(-3).reverse();
        
        if (recentNotes.length === 0) {
            return `
                <section class="recent-section">
                    <h2 class="section-title">Недавняя активность</h2>
                    <div class="empty-state small">
                        <i data-lucide="clock"></i>
                        <p>Пока нет активности</p>
                        <span>Создайте свой первый конспект или колоду карточек</span>
                    </div>
                </section>
            `;
        }
        
        return `
            <section class="recent-section">
                <h2 class="section-title">Недавние конспекты</h2>
                <div class="recent-list">
                    ${recentNotes.map(note => `
                        <div class="recent-item" data-note-id="${note.id}">
                            <div class="recent-icon">
                                <i data-lucide="file-text"></i>
                            </div>
                            <div class="recent-info">
                                <span class="recent-title">${note.title || 'Без названия'}</span>
                                <span class="recent-date">${this.formatDate(note.updatedAt)}</span>
                            </div>
                            <i data-lucide="chevron-right"></i>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }
    
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Только что';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} дн. назад`;
        
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    
    initEvents(container) {
        // Клик по модулям
        container.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const module = card.dataset.module;
                this.app.navigateTo(module);
            });
        });
        
        // Профиль
        container.querySelector('#quick-profile')?.addEventListener('click', () => {
            this.app.openProfile();
        });
        
        // Недавние элементы
        container.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                this.app.navigateTo('notes');
                // TODO: открыть конкретную заметку
            });
        });
    }
}
