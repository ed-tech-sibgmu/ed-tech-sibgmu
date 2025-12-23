/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Theme Module
 * Управление темами и акцентными цветами
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class Theme {
    constructor() {
        this.storageKey = 'edugen_theme';
        this.accentKey = 'edugen_accent';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }
    
    init() {
        // Загружаем сохранённые настройки
        const savedTheme = localStorage.getItem(this.storageKey) || 'system';
        const savedAccent = localStorage.getItem(this.accentKey) || 'violet';
        
        this.setTheme(savedTheme);
        this.setAccent(savedAccent);
        
        // Слушаем изменения системной темы
        this.mediaQuery.addEventListener('change', () => {
            const currentTheme = localStorage.getItem(this.storageKey);
            if (currentTheme === 'system') {
                this.applyTheme('system');
            }
        });
    }
    
    setTheme(theme) {
        localStorage.setItem(this.storageKey, theme);
        this.applyTheme(theme);
    }
    
    applyTheme(theme) {
        let actualTheme = theme;
        
        if (theme === 'system') {
            actualTheme = this.mediaQuery.matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', actualTheme);
    }
    
    setAccent(accent) {
        localStorage.setItem(this.accentKey, accent);
        document.documentElement.setAttribute('data-accent', accent);
    }
    
    getTheme() {
        return localStorage.getItem(this.storageKey) || 'system';
    }
    
    getAccent() {
        return localStorage.getItem(this.accentKey) || 'violet';
    }
    
    isDark() {
        const theme = this.getTheme();
        if (theme === 'system') {
            return this.mediaQuery.matches;
        }
        return theme === 'dark';
    }
}
