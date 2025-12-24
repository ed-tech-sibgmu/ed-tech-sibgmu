/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Toast Module
 * Всплывающие уведомления
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class Toast {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.toasts = [];
        this.defaultDuration = 4000;
    }

    /**
     * Показать уведомление
     */
    show(options) {
        const {
            title = '',
            message = '',
            type = 'info', // success, warning, error, info
            duration = this.defaultDuration
        } = typeof options === 'string' ? { message: options } : options;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconName = {
            success: 'check-circle',
            warning: 'alert-triangle',
            error: 'x-circle',
            info: 'info'
        }[type];

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i data-lucide="x"></i>
            </button>
        `;

        // Обработчик закрытия
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.remove(toast);
        });

        this.container.appendChild(toast);
        lucide.createIcons();

        // Автоматическое удаление
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        this.toasts.push(toast);
        return toast;
    }

    /**
     * Удалить уведомление
     */
    remove(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.add('removing');
        setTimeout(() => {
            toast.remove();
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 200);
    }

    /**
     * Удалить все уведомления
     */
    clear() {
        this.toasts.forEach(toast => this.remove(toast));
    }

    // Shorthand методы
    success(message, title = '') {
        return this.show({ message, title, type: 'success' });
    }

    warning(message, title = '') {
        return this.show({ message, title, type: 'warning' });
    }

    error(message, title = '') {
        return this.show({ message, title, type: 'error' });
    }

    info(message, title = '') {
        return this.show({ message, title, type: 'info' });
    }
}