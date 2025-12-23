/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EduGen — Main Application
 * Главный модуль приложения
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Storage } from './modules/storage.js';
import { Theme } from './modules/theme.js';
import { Modal } from './modules/modal.js';
import { Toast } from './modules/toast.js';
import { Onboarding } from './modules/onboarding.js';
import { Router } from './modules/router.js';
import { HomePage } from './modules/pages/home.js';
import { NotesPage } from './modules/pages/notes.js';
import { CardsPage } from './modules/pages/cards.js';
import { TestsPage } from './modules/pages/tests.js';

class App {
    constructor() {
        this.storage = new Storage();
        this.theme = new Theme();
        this.modal = new Modal();
        this.toast = new Toast();
        this.router = new Router();
        
        // Страницы
        this.pages = {
            home: new HomePage(this),
            notes: new NotesPage(this),
            cards: new CardsPage(this),
            tests: new TestsPage(this)
        };
        
        this.onboarding = new Onboarding(this);
        
        this.init();
    }
    
    async init() {
        // Инициализируем тему
        this.theme.init();
        
        // Инициализируем иконки Lucide
        lucide.createIcons();
        
        // Показываем splash screen
        await this.showSplash();
        
        // Проверяем, прошёл ли пользователь онбординг
        const hasCompletedOnboarding = this.storage.get('onboarding_completed');
        
        if (!hasCompletedOnboarding) {
            this.onboarding.start();
        } else {
            this.showApp();
        }
        
        // Инициализируем роутер и события
        this.initNavigation();
        this.initSettings();
        this.initGlobalEvents();
    }
    
    async showSplash() {
        return new Promise(resolve => {
            setTimeout(() => {
                const splash = document.getElementById('splash-screen');
                splash.classList.add('hidden');
                setTimeout(resolve, 500);
            }, 1800);
        });
    }
    
    showApp() {
        const app = document.getElementById('app');
        app.style.display = 'flex';
        
        // Загружаем начальную страницу
        this.navigateTo('home');
        
        // Обновляем иконки
        lucide.createIcons();
    }
    
    initNavigation() {
        // Навигация по боковой панели
        document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    navigateTo(page) {
        // Обновляем активный пункт меню
        document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        // Рендерим страницу
        const mainContent = document.getElementById('main-content');
        
        if (this.pages[page]) {
            mainContent.innerHTML = '';
            this.pages[page].render(mainContent);
            lucide.createIcons();
        }
    }
    
    initSettings() {
        // Открытие настроек
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettings();
        });
        
        // Закрытие настроек
        document.getElementById('settings-close').addEventListener('click', () => {
            this.modal.close('settings-modal');
        });
        
        // Backdrop клик
        document.querySelector('#settings-modal .modal-backdrop').addEventListener('click', () => {
            this.modal.close('settings-modal');
        });
        
        // Переключение тем
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.theme.setTheme(theme);
                this.updateThemeButtons();
            });
        });
        
        // Переключение акцентных цветов
        document.querySelectorAll('.accent-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const accent = btn.dataset.accent;
                this.theme.setAccent(accent);
                this.updateAccentButtons();
            });
        });
        
        // Toggle для паролей
        document.querySelectorAll('.input-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const inputId = btn.dataset.toggle;
                const input = document.getElementById(inputId);
                const icon = btn.querySelector('svg');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.setAttribute('data-lucide', 'eye-off');
                } else {
                    input.type = 'password';
                    icon.setAttribute('data-lucide', 'eye');
                }
                lucide.createIcons();
            });
        });
        
        // Сохранение API ключей
        document.getElementById('anthropic-key').addEventListener('change', (e) => {
            this.storage.set('anthropic_api_key', e.target.value);
        });
        
        document.getElementById('gemini-key').addEventListener('change', (e) => {
            this.storage.set('gemini_api_key', e.target.value);
        });
        
        // Загрузка материалов из настроек
        document.getElementById('settings-upload-materials').addEventListener('click', () => {
            this.modal.close('settings-modal');
            this.modal.open('materials-modal');
        });
        
        // Экспорт данных
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        // Импорт данных
        document.getElementById('import-data').addEventListener('click', () => {
            this.importData();
        });
        
        // Сброс данных
        document.getElementById('reset-data').addEventListener('click', () => {
            this.confirmReset();
        });
        
        // Профиль
        document.getElementById('profile-btn').addEventListener('click', () => {
            this.openProfile();
        });
        
        // Загружаем сохранённые ключи
        const anthropicKey = this.storage.get('anthropic_api_key');
        const geminiKey = this.storage.get('gemini_api_key');
        
        if (anthropicKey) document.getElementById('anthropic-key').value = anthropicKey;
        if (geminiKey) document.getElementById('gemini-key').value = geminiKey;
        
        this.updateThemeButtons();
        this.updateAccentButtons();
    }
    
    openSettings() {
        this.modal.open('settings-modal');
        lucide.createIcons();
    }
    
    updateThemeButtons() {
        const currentTheme = this.theme.getTheme();
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
        });
    }
    
    updateAccentButtons() {
        const currentAccent = this.theme.getAccent();
        document.querySelectorAll('.accent-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.accent === currentAccent);
        });
    }
    
    openProfile() {
        const profile = this.storage.get('user_profile');
        
        if (profile) {
            // Показываем информацию о профиле
            const content = `
                <div class="profile-info">
                    <div class="profile-item">
                        <strong>Предметная область:</strong> ${profile.topic || 'Не указана'}
                    </div>
                    <div class="profile-item">
                        <strong>Уровень:</strong> ${profile.level || 'Не указан'}
                    </div>
                    <div class="profile-item">
                        <strong>Глубина:</strong> ${profile.depth || 'Не указана'}
                    </div>
                    <div class="profile-item">
                        <strong>Стиль:</strong> ${profile.style || 'Не указан'}
                    </div>
                    <div class="profile-item">
                        <strong>Язык:</strong> ${profile.language || 'Русский'}
                    </div>
                </div>
            `;
            
            this.modal.confirm({
                title: 'Профиль обучения',
                message: content,
                confirmText: 'Изменить',
                cancelText: 'Закрыть',
                onConfirm: () => {
                    this.onboarding.start();
                }
            });
        } else {
            this.onboarding.start();
        }
    }
    
    exportData() {
        const data = {
            profile: this.storage.get('user_profile'),
            notes: this.storage.get('notes') || [],
            cards: this.storage.get('cards') || [],
            decks: this.storage.get('decks') || [],
            tests: this.storage.get('tests') || [],
            settings: {
                theme: this.storage.get('theme'),
                accent: this.storage.get('accent')
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edugen-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.toast.success('Данные экспортированы');
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (data.profile) this.storage.set('user_profile', data.profile);
                if (data.notes) this.storage.set('notes', data.notes);
                if (data.cards) this.storage.set('cards', data.cards);
                if (data.decks) this.storage.set('decks', data.decks);
                if (data.tests) this.storage.set('tests', data.tests);
                if (data.settings) {
                    if (data.settings.theme) this.theme.setTheme(data.settings.theme);
                    if (data.settings.accent) this.theme.setAccent(data.settings.accent);
                }
                
                this.toast.success('Данные импортированы');
                this.navigateTo('home');
                
            } catch (err) {
                this.toast.error('Ошибка при импорте данных');
                console.error(err);
            }
        });
        
        input.click();
    }
    
    confirmReset() {
        this.modal.confirm({
            title: 'Сбросить все данные?',
            message: 'Это действие удалит все ваши конспекты, карточки, тесты и настройки. Отменить это действие будет невозможно.',
            confirmText: 'Сбросить',
            isDanger: true,
            onConfirm: () => {
                this.storage.clear();
                location.reload();
            }
        });
    }
    
    initGlobalEvents() {
        // Закрытие модалок по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    this.modal.close(activeModal.id);
                }
            }
        });
        
        // Глобальный обработчик для закрытия модалок по клику на backdrop
        document.addEventListener('click', (e) => {
            // Проверяем, был ли клик по backdrop
            if (e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.closest('.modal');
                if (modal && modal.classList.contains('active')) {
                    this.modal.close(modal.id);
                }
            }
        });
        
        // Мобильное меню
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuBtn = e.target.closest('.mobile-menu-btn');
            
            if (menuBtn) {
                sidebar.classList.toggle('open');
            } else if (!e.target.closest('.sidebar') && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
