/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Modal Module
 * Управление модальными окнами
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class Modal {
    constructor() {
        this.activeModals = [];
    }
    
    /**
     * Открыть модальное окно
     */
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.add('active');
        this.activeModals.push(modalId);
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Закрыть модальное окно
     */
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('active');
        this.activeModals = this.activeModals.filter(id => id !== modalId);
        
        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
    }
    
    /**
     * Закрыть все модальные окна
     */
    closeAll() {
        this.activeModals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) modal.classList.remove('active');
        });
        this.activeModals = [];
        document.body.style.overflow = '';
    }
    
    /**
     * Показать диалог подтверждения
     */
    confirm(options) {
        const {
            title = 'Подтверждение',
            message = 'Вы уверены?',
            confirmText = 'Подтвердить',
            cancelText = 'Отмена',
            isDanger = false,
            onConfirm = () => {},
            onCancel = () => {}
        } = options;
        
        const dialog = document.getElementById('confirm-dialog');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconEl = document.getElementById('confirm-icon');
        const confirmBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        
        titleEl.textContent = title;
        messageEl.innerHTML = message;
        
        if (isDanger) {
            iconEl.classList.add('danger');
            confirmBtn.className = 'btn btn-danger';
        } else {
            iconEl.classList.remove('danger');
            confirmBtn.className = 'btn btn-primary';
        }
        
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;
        
        // Обработчики
        const handleConfirm = () => {
            onConfirm();
            this.close('confirm-dialog');
            cleanup();
        };
        
        const handleCancel = () => {
            onCancel();
            this.close('confirm-dialog');
            cleanup();
        };
        
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        
        this.open('confirm-dialog');
        lucide.createIcons();
    }
}
