/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Onboarding Module
 * Онбординг и профилирование пользователя
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class Onboarding {
    constructor(app) {
        this.app = app;
        this.currentStep = 0;
        this.totalSteps = 5;
        this.profile = {};
        
        this.steps = [
            {
                title: 'Предметная область',
                description: 'Укажите тему или предмет, который хотите изучать',
                hint: 'Например: «биохимия, метаболизм углеводов» или «органическая химия, 1 семестр»',
                type: 'text',
                key: 'topic',
                placeholder: 'Введите тему обучения...',
                required: true
            },
            {
                title: 'Текущий уровень знаний',
                description: 'Выберите уровень, который лучше всего описывает ваши текущие знания по теме',
                type: 'radio',
                key: 'level',
                options: [
                    { value: 'новичок', label: 'Новичок', description: 'Первое знакомство с темой' },
                    { value: 'базовый', label: 'Базовый', description: 'Знаю основы, нужна систематизация' },
                    { value: 'средний', label: 'Средний', description: 'Материал знаком, нужно углубление' },
                    { value: 'продвинутый', label: 'Продвинутый', description: 'Хорошо знаю, повторяю детали' },
                    { value: 'специалист', label: 'Специалист', description: 'Освежаю, интересуют только нюансы' }
                ],
                required: true
            },
            {
                title: 'Глубина детализации',
                description: 'Насколько подробно вы хотите изучать материал?',
                type: 'radio',
                key: 'depth',
                options: [
                    { value: 'концептуальная', label: 'Концептуальная', description: 'Главные идеи и общая картина' },
                    { value: 'стандартная', label: 'Стандартная', description: 'Как в хорошем учебнике' },
                    { value: 'детальная', label: 'Детальная', description: 'Механизмы, причинно-следственные связи' },
                    { value: 'максимальная', label: 'Максимальная', description: 'Все нюансы, исключения, пограничные случаи' }
                ],
                required: true
            },
            {
                title: 'Стиль объяснений',
                description: 'Какой стиль изложения вам ближе?',
                type: 'radio',
                key: 'style',
                options: [
                    { value: 'академический', label: 'Академический', description: 'Точные определения, строгая терминология' },
                    { value: 'практический', label: 'Практический', description: 'Баланс строгости и понятности' },
                    { value: 'разговорный', label: 'Разговорный', description: 'Метафоры, аналогии, упрощение без потери сути' },
                    { value: 'адаптивный', label: 'Адаптивный', description: 'Подстраивается под сложность темы' }
                ],
                required: true
            },
            {
                title: 'Язык материалов',
                description: 'Настройки языка для генерируемых материалов',
                type: 'language',
                key: 'language',
                required: true
            }
        ];
        
        this.init();
    }
    
    init() {
        // Кнопки навигации
        document.getElementById('onboarding-next').addEventListener('click', () => this.next());
        document.getElementById('onboarding-back').addEventListener('click', () => this.back());
        
        // Backdrop
        document.querySelector('#onboarding-modal .modal-backdrop').addEventListener('click', (e) => {
            // Не закрываем при клике на backdrop во время онбординга
            e.stopPropagation();
        });
        
        // Materials modal
        document.getElementById('materials-skip').addEventListener('click', () => this.skipMaterials());
        document.getElementById('materials-done').addEventListener('click', () => this.finishMaterials());
        document.getElementById('materials-close').addEventListener('click', () => this.skipMaterials());
        
        // Upload zone
        this.initUploadZone();
    }
    
    start() {
        this.currentStep = 0;
        this.profile = this.app.storage.get('user_profile') || {};
        this.render();
        this.app.modal.open('onboarding-modal');
    }
    
    render() {
        const step = this.steps[this.currentStep];
        const content = document.getElementById('onboarding-content');
        const progress = document.getElementById('onboarding-progress');
        const stepText = document.getElementById('onboarding-step-text');
        const backBtn = document.getElementById('onboarding-back');
        const nextBtn = document.getElementById('onboarding-next');
        
        // Progress
        progress.style.width = `${((this.currentStep + 1) / this.totalSteps) * 100}%`;
        stepText.textContent = `Шаг ${this.currentStep + 1} из ${this.totalSteps}`;
        
        // Back button
        backBtn.style.display = this.currentStep > 0 ? 'inline-flex' : 'none';
        
        // Next button
        nextBtn.innerHTML = this.currentStep === this.totalSteps - 1 
            ? 'Готово <i data-lucide="check"></i>'
            : 'Далее <i data-lucide="arrow-right"></i>';
        
        // Content
        let html = `
            <div class="onboarding-step">
                <h3 class="step-title">${step.title}</h3>
                <p class="step-description">${step.description}</p>
        `;
        
        switch (step.type) {
            case 'text':
                html += `
                    <div class="input-group">
                        <input 
                            type="text" 
                            id="onboarding-input" 
                            class="onboarding-text-input"
                            placeholder="${step.placeholder || ''}"
                            value="${this.profile[step.key] || ''}"
                        >
                    </div>
                `;
                if (step.hint) {
                    html += `<p class="step-hint">${step.hint}</p>`;
                }
                break;
                
            case 'radio':
                html += '<div class="radio-group">';
                step.options.forEach(opt => {
                    const isSelected = this.profile[step.key] === opt.value;
                    html += `
                        <div class="radio-option ${isSelected ? 'selected' : ''}" data-value="${opt.value}">
                            <div class="radio-circle"></div>
                            <div class="option-content">
                                <div class="option-label">${opt.label}</div>
                                <div class="option-description">${opt.description}</div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                break;
                
            case 'language':
                html += `
                    <div class="input-group">
                        <label>Основной язык</label>
                        <select id="main-language">
                            <option value="русский" ${this.profile.language === 'русский' ? 'selected' : ''}>Русский</option>
                            <option value="english" ${this.profile.language === 'english' ? 'selected' : ''}>English</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Уровень владения иностранным (если релевантно)</label>
                        <div class="radio-group">
                            ${['A1-A2', 'B1-B2', 'C1-C2', 'не применимо'].map(level => `
                                <div class="radio-option ${this.profile.foreign_level === level ? 'selected' : ''}" data-value="${level}">
                                    <div class="radio-circle"></div>
                                    <div class="option-content">
                                        <div class="option-label">${level}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
        }
        
        html += '</div>';
        content.innerHTML = html;
        
        // Event listeners
        if (step.type === 'radio') {
            content.querySelectorAll('.radio-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    content.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    this.profile[step.key] = opt.dataset.value;
                });
            });
        }
        
        if (step.type === 'language') {
            const languageSelect = content.querySelector('#main-language');
            languageSelect.addEventListener('change', (e) => {
                this.profile.language = e.target.value;
            });
            
            content.querySelectorAll('.radio-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const group = opt.closest('.radio-group');
                    group.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    this.profile.foreign_level = opt.dataset.value;
                });
            });
        }
        
        lucide.createIcons();
    }
    
    validateStep() {
        const step = this.steps[this.currentStep];
        
        if (step.type === 'text') {
            const input = document.getElementById('onboarding-input');
            const value = input?.value.trim();
            if (step.required && !value) {
                this.app.toast.warning('Пожалуйста, заполните поле');
                input?.focus();
                return false;
            }
            this.profile[step.key] = value;
        }
        
        if (step.type === 'radio' && step.required) {
            if (!this.profile[step.key]) {
                this.app.toast.warning('Пожалуйста, выберите вариант');
                return false;
            }
        }
        
        if (step.type === 'language') {
            const languageSelect = document.getElementById('main-language');
            this.profile.language = languageSelect?.value || 'русский';
            if (!this.profile.foreign_level) {
                this.profile.foreign_level = 'B1-B2';
            }
        }
        
        return true;
    }
    
    next() {
        if (!this.validateStep()) return;
        
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.render();
        } else {
            this.finish();
        }
    }
    
    back() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    }
    
    finish() {
        // Сохраняем профиль
        this.app.storage.set('user_profile', this.profile);
        this.app.modal.close('onboarding-modal');
        
        // Показываем модалку загрузки материалов
        this.showMaterialsModal();
    }
    
    showMaterialsModal() {
        this.app.modal.open('materials-modal');
        lucide.createIcons();
    }
    
    initUploadZone() {
        const zone = document.getElementById('upload-zone');
        const input = document.getElementById('file-input');
        
        zone.addEventListener('click', () => input.click());
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }
    
    handleFiles(files) {
        const fileList = document.getElementById('uploaded-files');
        const existingFiles = this.app.storage.get('uploaded_materials') || [];
        
        Array.from(files).forEach(file => {
            // Проверяем тип файла
            const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            
            if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
                this.app.toast.warning(`Неподдерживаемый формат: ${file.name}`);
                return;
            }
            
            // Читаем файл
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content: e.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                existingFiles.push(fileData);
                this.app.storage.set('uploaded_materials', existingFiles);
                this.renderUploadedFiles();
            };
            
            if (file.type === 'application/pdf') {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }
    
    renderUploadedFiles() {
        const fileList = document.getElementById('uploaded-files');
        const files = this.app.storage.get('uploaded_materials') || [];
        
        if (files.length === 0) {
            fileList.innerHTML = '';
            return;
        }
        
        fileList.innerHTML = files.map((file, index) => `
            <div class="uploaded-file">
                <div class="file-icon">
                    <i data-lucide="file-text"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="file-remove" data-index="${index}">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `).join('');
        
        // Обработчики удаления
        fileList.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                files.splice(index, 1);
                this.app.storage.set('uploaded_materials', files);
                this.renderUploadedFiles();
            });
        });
        
        lucide.createIcons();
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    skipMaterials() {
        this.app.modal.close('materials-modal');
        this.completeOnboarding();
    }
    
    finishMaterials() {
        this.app.modal.close('materials-modal');
        this.completeOnboarding();
    }
    
    completeOnboarding() {
        this.app.storage.set('onboarding_completed', true);
        this.app.toast.success('Профиль настроен!');
        this.app.showApp();
    }
}
