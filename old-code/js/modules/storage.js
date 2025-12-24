/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Storage Module
 * Работа с localStorage
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class Storage {
    constructor(prefix = 'edugen_') {
        this.prefix = prefix;
    }
    
    /**
     * Получить значение
     */
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    }
    
    /**
     * Сохранить значение
     */
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }
    
    /**
     * Удалить значение
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }
    
    /**
     * Очистить всё хранилище
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
    
    /**
     * Получить все ключи
     */
    keys() {
        const result = [];
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                result.push(key.replace(this.prefix, ''));
            }
        });
        return result;
    }
    
    /**
     * Проверить существование ключа
     */
    has(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }
}
