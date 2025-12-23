/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NotesPage — Страница конспектов
 * Markdown + LaTeX редактор с файловой системой
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class NotesPage {
    constructor(app) {
        this.app = app;
        this.currentNote = null;
        this.currentFolder = null;
        this.isEditing = false;
        this.toolbarCollapsed = false;
        this.autoSaveTimer = null;
    }

    render(container) {
        container.innerHTML = `
            <div class="page notes-page">
                <!-- Основная область (по центру) -->
                <main class="notes-main">
                    ${this.currentNote
                ? this.renderEditor()
                : this.renderEmptyState()}
                </main>
                
                <!-- Боковая панель с файловой системой (справа) -->
                <aside class="notes-sidebar">
                    <div class="sidebar-header">
                        <h2>Файлы</h2>
                        <div class="sidebar-actions">
                            <button class="btn-icon" id="new-folder-btn" title="Новая папка">
                                <i data-lucide="folder-plus"></i>
                            </button>
                            <button class="btn-icon" id="new-note-btn" title="Новый конспект">
                                <i data-lucide="file-plus"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="file-tree" id="file-tree">
                        ${this.renderFileTree()}
                    </div>
                    
                    <div class="sidebar-footer">
                        <button class="btn btn-primary btn-block" id="generate-note-btn">
                            <i data-lucide="sparkles"></i>
                            <span>Сгенерировать</span>
                        </button>
                    </div>
                </aside>
            </div>
            
            <!-- Модальное окно генерации -->
            ${this.renderGenerateModal()}
            
            <!-- Модальное окно создания папки -->
            ${this.renderFolderModal()}
        `;

        this.initEvents(container);
        this.initMarkdownPreview();
    }

    renderFileTree() {
        const notes = this.app.storage.get('notes') || [];
        const folders = this.app.storage.get('note_folders') || [
            { id: 'root', name: 'Корневая папка', parent: null }
        ];

        if (folders.length === 0 && notes.length === 0) {
            return `
                <div class="file-tree-empty">
                    <i data-lucide="folder-open"></i>
                    <p>Нет конспектов</p>
                    <span>Создайте новый конспект или сгенерируйте с помощью ИИ</span>
                </div>
            `;
        }

        return this.buildTreeHTML(folders, notes, null);
    }

    buildTreeHTML(folders, notes, parentId) {
        const childFolders = folders.filter(f => f.parent === parentId && f.id !== 'root');
        const childNotes = notes.filter(n => n.folderId === parentId || (!n.folderId && parentId === null));

        if (childFolders.length === 0 && childNotes.length === 0) {
            return '';
        }

        let html = '<ul class="tree-list">';

        // Папки
        for (const folder of childFolders) {
            const hasChildren = folders.some(f => f.parent === folder.id) ||
                notes.some(n => n.folderId === folder.id);

            html += `
                <li class="tree-item folder ${hasChildren ? 'has-children' : ''}" data-folder-id="${folder.id}">
                    <div class="tree-item-content">
                        <button class="tree-toggle">
                            <i data-lucide="chevron-right"></i>
                        </button>
                        <i data-lucide="folder" class="tree-icon"></i>
                        <span class="tree-name">${folder.name}</span>
                        <div class="tree-actions">
                            <button class="tree-action" data-action="add-note" title="Добавить конспект">
                                <i data-lucide="file-plus"></i>
                            </button>
                            <button class="tree-action" data-action="delete-folder" title="Удалить">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                    <div class="tree-children collapsed">
                        ${this.buildTreeHTML(folders, notes, folder.id)}
                    </div>
                </li>
            `;
        }

        // Заметки
        for (const note of childNotes) {
            html += `
                <li class="tree-item note ${this.currentNote?.id === note.id ? 'active' : ''}" data-note-id="${note.id}">
                    <div class="tree-item-content">
                        <i data-lucide="file-text" class="tree-icon"></i>
                        <span class="tree-name">${note.title || 'Без названия'}</span>
                        <div class="tree-actions">
                            <button class="tree-action" data-action="delete-note" title="Удалить">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </li>
            `;
        }

        html += '</ul>';
        return html;
    }

    renderEmptyState() {
        return `
            <div class="notes-empty-state">
                <div class="empty-illustration">
                    <i data-lucide="book-open"></i>
                </div>
                <h3>Выберите конспект</h3>
                <p>Выберите конспект из списка слева или создайте новый</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" id="empty-new-note">
                        <i data-lucide="file-plus"></i>
                        <span>Новый конспект</span>
                    </button>
                    <button class="btn btn-outline" id="empty-generate">
                        <i data-lucide="sparkles"></i>
                        <span>Сгенерировать</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderEditor() {
        const note = this.currentNote;
        // isEditing теперь означает режим редактирования (исходный код) vs режим чтения (рендер)
        const isReadMode = !this.isEditing;

        return `
            <div class="note-editor obsidian-style">
                <!-- Верхний тулбар с названием и действиями -->
                <div class="editor-header-bar">
                    <input type="text" 
                           class="note-title-input" 
                           id="note-title" 
                           value="${note.title || ''}" 
                           placeholder="Название конспекта">
                    
                    <div class="header-actions">
                        <button class="btn-icon mode-toggle ${isReadMode ? 'reading' : 'editing'}" id="toggle-mode" title="${isReadMode ? 'Режим редактирования' : 'Режим чтения'}">
                            <i data-lucide="${isReadMode ? 'eye' : 'edit-3'}"></i>
                        </button>
                        <button class="btn-icon" id="export-note" title="Экспорт">
                            <i data-lucide="download"></i>
                        </button>
                        <button class="btn-icon" id="delete-note" title="Удалить">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Единое поле редактирования/просмотра -->
                <div class="editor-unified-area ${isReadMode ? 'read-mode' : 'edit-mode'}" id="unified-editor">
                    ${isReadMode ? `
                        <div class="note-preview markdown-body" id="note-preview">
                            ${this.renderMarkdown(note.content || '')}
                        </div>
                    ` : `
                        <textarea id="note-content" 
                                  class="note-textarea" 
                                  placeholder="Начните писать в Markdown...">${note.content || ''}</textarea>
                    `}
                </div>
                
                <!-- Нижний тулбар форматирования (сворачиваемый) -->
                <div class="editor-bottom-toolbar ${this.toolbarCollapsed ? 'collapsed' : ''}" id="bottom-toolbar">
                    <button class="toolbar-collapse-btn" id="collapse-toolbar" title="${this.toolbarCollapsed ? 'Развернуть' : 'Свернуть'}">
                        <i data-lucide="${this.toolbarCollapsed ? 'chevron-up' : 'chevron-down'}"></i>
                    </button>
                    
                    <div class="toolbar-content ${isReadMode ? 'disabled' : ''}">
                        <div class="toolbar-group">
                            <button class="format-btn" data-format="bold" title="Жирный (Ctrl+B)" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="bold"></i>
                            </button>
                            <button class="format-btn" data-format="italic" title="Курсив (Ctrl+I)" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="italic"></i>
                            </button>
                            <button class="format-btn" data-format="strikethrough" title="Зачёркнутый" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="strikethrough"></i>
                            </button>
                            <button class="format-btn" data-format="code" title="Код" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="code"></i>
                            </button>
                        </div>
                        
                        <div class="toolbar-divider"></div>
                        
                        <div class="toolbar-group">
                            <button class="format-btn" data-format="h1" title="Заголовок 1" ${isReadMode ? 'disabled' : ''}>H1</button>
                            <button class="format-btn" data-format="h2" title="Заголовок 2" ${isReadMode ? 'disabled' : ''}>H2</button>
                            <button class="format-btn" data-format="h3" title="Заголовок 3" ${isReadMode ? 'disabled' : ''}>H3</button>
                        </div>
                        
                        <div class="toolbar-divider"></div>
                        
                        <div class="toolbar-group">
                            <button class="format-btn" data-format="ul" title="Маркированный список" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="list"></i>
                            </button>
                            <button class="format-btn" data-format="ol" title="Нумерованный список" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="list-ordered"></i>
                            </button>
                            <button class="format-btn" data-format="checklist" title="Чеклист" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="check-square"></i>
                            </button>
                            <button class="format-btn" data-format="quote" title="Цитата" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="quote"></i>
                            </button>
                        </div>
                        
                        <div class="toolbar-divider"></div>
                        
                        <div class="toolbar-group">
                            <button class="format-btn" data-format="link" title="Ссылка" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="link"></i>
                            </button>
                            <button class="format-btn" data-format="image" title="Изображение" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="image"></i>
                            </button>
                            <button class="format-btn" data-format="table" title="Таблица" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="table"></i>
                            </button>
                            <button class="format-btn" data-format="math" title="Формула LaTeX" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="sigma"></i>
                            </button>
                            <button class="format-btn" data-format="callout" title="Callout" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="message-square"></i>
                            </button>
                            <button class="format-btn" data-format="codeblock" title="Блок кода" ${isReadMode ? 'disabled' : ''}>
                                <i data-lucide="file-code"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Статус-бар внутри нижнего тулбара -->
                    <div class="toolbar-status">
                        <span class="status-item">
                            <i data-lucide="clock"></i>
                            ${note.updatedAt ? this.formatDate(note.updatedAt) : 'Новый'}
                        </span>
                        <span class="status-item">
                            <i data-lucide="type"></i>
                            <span id="word-count">${this.countWords(note.content || '')}</span> слов
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    renderGenerateModal() {
        return `
            <div class="modal" id="generate-note-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-container modal-large">
                    <div class="modal-header">
                        <h3>Генерация конспекта</h3>
                        <button class="modal-close" data-close="generate-note-modal">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Тема конспекта</label>
                            <input type="text" 
                                   class="form-input" 
                                   id="generate-topic" 
                                   placeholder="Например: Цикл Кребса, Митохондрии">
                        </div>
                        
                        <div class="form-group">
                            <label>Объём</label>
                            <div class="radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="note-size" value="brief" checked>
                                    <span class="radio-label">
                                        <strong>Краткий</strong>
                                        <small>~5 000 символов — ключевые тезисы</small>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="note-size" value="medium">
                                    <span class="radio-label">
                                        <strong>Средний</strong>
                                        <small>~20 000 символов — полноценное изложение</small>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="note-size" value="detailed">
                                    <span class="radio-label">
                                        <strong>Развёрнутый</strong>
                                        <small>~40 000 символов — глубокий разбор</small>
                                    </span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Дополнительные инструкции (опционально)</label>
                            <textarea class="form-input form-textarea" 
                                      id="generate-instructions" 
                                      placeholder="Особые требования к конспекту..."></textarea>
                        </div>
                        
                        <div class="generate-progress hidden" id="generate-progress">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <span class="progress-text">Генерация конспекта...</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" data-close="generate-note-modal">Отмена</button>
                        <button class="btn btn-primary" id="start-generate">
                            <i data-lucide="sparkles"></i>
                            <span>Сгенерировать</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderFolderModal() {
        return `
            <div class="modal" id="folder-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-container modal-small">
                    <div class="modal-header">
                        <h3>Новая папка</h3>
                        <button class="modal-close" data-close="folder-modal">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Название папки</label>
                            <input type="text" 
                                   class="form-input" 
                                   id="folder-name" 
                                   placeholder="Введите название">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" data-close="folder-modal">Отмена</button>
                        <button class="btn btn-primary" id="create-folder">Создать</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderMarkdown(content) {
        if (!content) return '<p class="placeholder">Предпросмотр появится здесь...</p>';

        try {
            // Обрабатываем callouts в стиле Obsidian
            let processed = this.processCallouts(content);

            // Парсим Markdown
            let html = marked.parse(processed);

            // Рендерим LaTeX
            html = this.renderLatex(html);

            return html;
        } catch (e) {
            console.error('Markdown render error:', e);
            return `<pre>${content}</pre>`;
        }
    }

    processCallouts(content) {
        // Obsidian-style callouts: > [!note] или > [!warning] и т.д.
        const calloutRegex = /^>\s*\[!(note|tip|warning|danger|example|info|quote)\](.*)$/gim;

        return content.replace(calloutRegex, (match, type, title) => {
            return `<div class="callout callout-${type}"><div class="callout-title">${type.toUpperCase()}${title}</div>`;
        });
    }

    renderLatex(html) {
        // Блочные формулы $$...$$
        html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
            try {
                return katex.renderToString(tex.trim(), { displayMode: true });
            } catch (e) {
                return `<span class="latex-error">${tex}</span>`;
            }
        });

        // Инлайн формулы $...$
        html = html.replace(/\$([^\$]+?)\$/g, (match, tex) => {
            try {
                return katex.renderToString(tex.trim(), { displayMode: false });
            } catch (e) {
                return `<span class="latex-error">${tex}</span>`;
            }
        });

        return html;
    }

    countWords(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(w => w.length > 0).length;
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    initEvents(container) {
        // Файловое дерево
        this.initFileTreeEvents(container);

        // Создание новой заметки
        container.querySelector('#new-note-btn')?.addEventListener('click', () => {
            this.createNewNote();
        });

        container.querySelector('#empty-new-note')?.addEventListener('click', () => {
            this.createNewNote();
        });

        // Создание папки
        container.querySelector('#new-folder-btn')?.addEventListener('click', () => {
            this.app.modal.open('folder-modal');
        });

        container.querySelector('#create-folder')?.addEventListener('click', () => {
            this.createFolder();
        });

        // Генерация
        container.querySelector('#generate-note-btn')?.addEventListener('click', () => {
            this.app.modal.open('generate-note-modal');
        });

        container.querySelector('#empty-generate')?.addEventListener('click', () => {
            this.app.modal.open('generate-note-modal');
        });

        container.querySelector('#start-generate')?.addEventListener('click', () => {
            this.generateNote();
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

        // Редактор
        this.initEditorEvents(container);
    }

    initFileTreeEvents(container) {
        const tree = container.querySelector('#file-tree');
        if (!tree) return;

        // Раскрытие/сворачивание папок
        tree.querySelectorAll('.tree-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.tree-item');
                const children = item.querySelector('.tree-children');
                if (children) {
                    children.classList.toggle('collapsed');
                    item.classList.toggle('expanded');
                }
            });
        });

        // Выбор заметки
        tree.querySelectorAll('.tree-item.note').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                this.openNote(noteId);
            });
        });

        // Действия с элементами
        tree.querySelectorAll('.tree-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const item = btn.closest('.tree-item');

                switch (action) {
                    case 'add-note':
                        this.createNewNote(item.dataset.folderId);
                        break;
                    case 'delete-folder':
                        this.deleteFolder(item.dataset.folderId);
                        break;
                    case 'delete-note':
                        this.deleteNote(item.dataset.noteId);
                        break;
                }
            });
        });
    }

    initEditorEvents(container) {
        const titleInput = container.querySelector('#note-title');
        const contentArea = container.querySelector('#note-content');
        const preview = container.querySelector('#note-preview');

        // Автосохранение
        const saveHandler = () => {
            if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = setTimeout(() => this.saveCurrentNote(), 1000);
        };

        titleInput?.addEventListener('input', saveHandler);
        
        // События для режима редактирования
        if (contentArea) {
            contentArea.addEventListener('input', () => {
                saveHandler();
                // Обновляем счётчик слов
                const wordCount = container.querySelector('#word-count');
                if (wordCount) {
                    wordCount.textContent = this.countWords(contentArea.value);
                }
            });
            
            // Горячие клавиши в редакторе
            contentArea.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'b':
                            e.preventDefault();
                            this.applyFormat('bold', contentArea);
                            break;
                        case 'i':
                            e.preventDefault();
                            this.applyFormat('italic', contentArea);
                            break;
                        case 's':
                            e.preventDefault();
                            this.saveCurrentNote();
                            this.app.toast.success('Сохранено');
                            break;
                    }
                }
            });
        }

        // Переключение режима редактирования/чтения
        container.querySelector('#toggle-mode')?.addEventListener('click', () => {
            // Сохраняем текущее содержимое перед переключением
            if (this.isEditing && contentArea) {
                this.currentNote.content = contentArea.value;
                this.saveCurrentNote();
            }
            this.isEditing = !this.isEditing;
            this.render(document.getElementById('main-content'));
        });

        // Сворачивание/разворачивание тулбара
        container.querySelector('#collapse-toolbar')?.addEventListener('click', () => {
            this.toolbarCollapsed = !this.toolbarCollapsed;
            const toolbar = container.querySelector('#bottom-toolbar');
            toolbar?.classList.toggle('collapsed', this.toolbarCollapsed);
            // Обновляем иконку
            const icon = container.querySelector('#collapse-toolbar i');
            if (icon) {
                icon.setAttribute('data-lucide', this.toolbarCollapsed ? 'chevron-up' : 'chevron-down');
                lucide.createIcons();
            }
        });

        // Форматирование (только в режиме редактирования)
        container.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isEditing) return;
                const format = btn.dataset.format;
                const textarea = container.querySelector('#note-content');
                if (textarea) {
                    this.applyFormat(format, textarea);
                }
            });
        });

        // Экспорт
        container.querySelector('#export-note')?.addEventListener('click', () => {
            this.exportCurrentNote();
        });

        // Удаление
        container.querySelector('#delete-note')?.addEventListener('click', () => {
            if (this.currentNote) {
                this.deleteNote(this.currentNote.id);
            }
        });
        
        // Двойной клик по превью для входа в режим редактирования
        container.querySelector('#note-preview')?.addEventListener('dblclick', () => {
            this.isEditing = true;
            this.render(document.getElementById('main-content'));
        });
    }

    initMarkdownPreview() {
        // Настройка marked
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                gfm: true,
                breaks: true,
                highlight: (code, lang) => {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }
                    return code;
                }
            });
        }
    }

    applyFormat(format, textarea) {
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        let replacement = '';
        let cursorOffset = 0;

        const formats = {
            bold: { prefix: '**', suffix: '**', placeholder: 'жирный текст' },
            italic: { prefix: '*', suffix: '*', placeholder: 'курсив' },
            strikethrough: { prefix: '~~', suffix: '~~', placeholder: 'зачёркнутый' },
            code: { prefix: '`', suffix: '`', placeholder: 'код' },
            h1: { prefix: '# ', suffix: '', placeholder: 'Заголовок 1', lineStart: true },
            h2: { prefix: '## ', suffix: '', placeholder: 'Заголовок 2', lineStart: true },
            h3: { prefix: '### ', suffix: '', placeholder: 'Заголовок 3', lineStart: true },
            ul: { prefix: '- ', suffix: '', placeholder: 'элемент списка', lineStart: true },
            ol: { prefix: '1. ', suffix: '', placeholder: 'элемент списка', lineStart: true },
            checklist: { prefix: '- [ ] ', suffix: '', placeholder: 'задача', lineStart: true },
            quote: { prefix: '> ', suffix: '', placeholder: 'цитата', lineStart: true },
            link: { prefix: '[', suffix: '](url)', placeholder: 'текст ссылки' },
            image: { prefix: '![', suffix: '](url)', placeholder: 'alt текст' },
            math: { prefix: '$', suffix: '$', placeholder: 'формула' },
            callout: { prefix: '> [!note] ', suffix: '\n> ', placeholder: 'Заголовок\n> Содержимое', lineStart: true },
            table: { prefix: '| Заголовок 1 | Заголовок 2 |\n|-------------|-------------|\n| ', suffix: ' | Данные 2 |', placeholder: 'Данные 1', lineStart: true },
            codeblock: { prefix: '```\n', suffix: '\n```', placeholder: 'код', lineStart: true }
        };

        const fmt = formats[format];
        if (!fmt) return;

        if (selected) {
            replacement = fmt.prefix + selected + fmt.suffix;
        } else {
            replacement = fmt.prefix + fmt.placeholder + fmt.suffix;
            cursorOffset = fmt.prefix.length + fmt.placeholder.length;
        }

        // Вставляем
        textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

        // Позиционируем курсор
        const newPos = selected ? start + replacement.length : start + cursorOffset;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();

        // Триггерим input для обновления превью
        textarea.dispatchEvent(new Event('input'));
    }

    createNewNote(folderId = null) {
        const note = {
            id: this.generateId(),
            title: '',
            content: '',
            folderId: folderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const notes = this.app.storage.get('notes') || [];
        notes.push(note);
        this.app.storage.set('notes', notes);

        this.currentNote = note;
        this.isEditing = true;
        this.render(document.getElementById('main-content'));

        // Фокус на заголовок
        setTimeout(() => {
            document.getElementById('note-title')?.focus();
        }, 100);
    }

    openNote(noteId) {
        const notes = this.app.storage.get('notes') || [];
        const note = notes.find(n => n.id === noteId);

        if (note) {
            this.currentNote = note;
            this.isEditing = false;
            this.render(document.getElementById('main-content'));
        }
    }

    saveCurrentNote() {
        if (!this.currentNote) return;

        const titleInput = document.getElementById('note-title');
        const contentArea = document.getElementById('note-content');

        if (titleInput) this.currentNote.title = titleInput.value;
        // Сохраняем содержимое только если редактор доступен (режим редактирования)
        if (contentArea) this.currentNote.content = contentArea.value;
        this.currentNote.updatedAt = new Date().toISOString();

        const notes = this.app.storage.get('notes') || [];
        const index = notes.findIndex(n => n.id === this.currentNote.id);

        if (index !== -1) {
            notes[index] = this.currentNote;
        } else {
            notes.push(this.currentNote);
        }

        this.app.storage.set('notes', notes);
    }

    deleteNote(noteId) {
        this.app.modal.confirm({
            title: 'Удалить конспект?',
            message: 'Это действие нельзя отменить.',
            confirmText: 'Удалить',
            isDanger: true,
            onConfirm: () => {
                const notes = this.app.storage.get('notes') || [];
                const filtered = notes.filter(n => n.id !== noteId);
                this.app.storage.set('notes', filtered);

                if (this.currentNote?.id === noteId) {
                    this.currentNote = null;
                }

                this.render(document.getElementById('main-content'));
                this.app.toast.success('Конспект удалён');
            }
        });
    }

    createFolder() {
        const nameInput = document.getElementById('folder-name');
        const name = nameInput?.value.trim();

        if (!name) {
            this.app.toast.warning('Введите название папки');
            return;
        }

        const folder = {
            id: this.generateId(),
            name: name,
            parent: this.currentFolder
        };

        const folders = this.app.storage.get('note_folders') || [];
        folders.push(folder);
        this.app.storage.set('note_folders', folders);

        this.app.modal.close('folder-modal');
        this.render(document.getElementById('main-content'));
        this.app.toast.success('Папка создана');
    }

    deleteFolder(folderId) {
        this.app.modal.confirm({
            title: 'Удалить папку?',
            message: 'Все конспекты внутри папки будут перемещены в корень.',
            confirmText: 'Удалить',
            isDanger: true,
            onConfirm: () => {
                // Перемещаем заметки в корень
                const notes = this.app.storage.get('notes') || [];
                notes.forEach(n => {
                    if (n.folderId === folderId) n.folderId = null;
                });
                this.app.storage.set('notes', notes);

                // Удаляем папку
                const folders = this.app.storage.get('note_folders') || [];
                const filtered = folders.filter(f => f.id !== folderId);
                this.app.storage.set('note_folders', filtered);

                this.render(document.getElementById('main-content'));
                this.app.toast.success('Папка удалена');
            }
        });
    }

    exportCurrentNote() {
        if (!this.currentNote) return;

        const content = this.currentNote.content || '';
        const title = this.currentNote.title || 'Конспект';

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.md`;
        a.click();
        URL.revokeObjectURL(url);

        this.app.toast.success('Конспект экспортирован');
    }

    async generateNote() {
        const topic = document.getElementById('generate-topic')?.value.trim();
        const size = document.querySelector('input[name="note-size"]:checked')?.value || 'medium';
        const instructions = document.getElementById('generate-instructions')?.value.trim();

        if (!topic) {
            this.app.toast.warning('Введите тему конспекта');
            return;
        }

        const apiKey = "${secrets.HUGGING_FACE_TOKEN}";
        if (!apiKey) {
            this.app.toast.error('Добавьте API ключ Anthropic в настройках');
            return;
        }

        // Показываем прогресс
        const progress = document.getElementById('generate-progress');
        progress?.classList.remove('hidden');

        const btn = document.getElementById('start-generate');
        if (btn) btn.disabled = true;

        try {
            const profile = this.app.storage.get('user_profile') || {};
            const content = await this.callAI(apiKey, topic, size, instructions, profile);

            // Создаём новую заметку
            const note = {
                id: this.generateId(),
                title: topic,
                content: content,
                folderId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                generated: true
            };

            const notes = this.app.storage.get('notes') || [];
            notes.push(note);
            this.app.storage.set('notes', notes);

            this.app.modal.close('generate-note-modal');
            this.currentNote = note;
            this.isEditing = false;
            this.render(document.getElementById('main-content'));

            this.app.toast.success('Конспект сгенерирован!');

        } catch (error) {
            console.error('Generate error:', error);
            this.app.toast.error('Ошибка генерации: ' + error.message);
        } finally {
            progress?.classList.add('hidden');
            if (btn) btn.disabled = false;
        }
    }

    async callAI(apiKey, topic, size, instructions, profile) {
        const sizeTokens = {
            brief: 2000,
            medium: 8000,
            detailed: 16000
        };

        const systemPrompt = this.buildSystemPrompt(profile);
        const userPrompt = this.buildUserPrompt(topic, size, instructions);

        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            	Authorization: 'Bearer ${secrets.HUGGING_FACE_TOKEN}',
            },
            body: JSON.stringify({
                "system": systemPrompt,
                "messages":[{"role":"user","content": userPrompt}],
                "model":"deepseek-ai/DeepSeek-V3.2"})

        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API Error');
        }

        const data = await response.json();
        return data.content[0].text;
    }

    buildSystemPrompt(profile) {
        return `Ты — эксперт по созданию учебных конспектов. Создавай структурированные конспекты в формате Markdown с поддержкой LaTeX для формул.

<user_profile>
ТЕМА: ${profile.topic || 'Общая'}
УРОВЕНЬ: ${profile.level || 'средний'}
ГЛУБИНА: ${profile.depth || 'стандартная'}
СТИЛЬ: ${profile.style || 'практический'}
ЯЗЫК: ${profile.language || 'Русский'}
</user_profile>

<base_instructions>
АДАПТАЦИЯ ПОД УРОВЕНЬ:
- Новичок: базовые определения, объяснение терминов, от простого к сложному
- Базовый: предполагай знание основ, акцентируй связи между темами
- Средний: углубление механизмов, причинно-следственные связи
- Продвинутый: детали, исключения, практическое применение
- Специалист: минимум базы, фокус на нюансах и спорных вопросах

ГЛУБИНА ДЕТАЛИЗАЦИИ:
- Концептуальная: главные идеи, минимум деталей
- Стандартная: баланс теории и практики, базовые механизмы
- Детальная: разбор механизмов, «почему» и «как именно»; причинно-следственные связи
- Максимальная: всё вышеперечисленное + нюансы, исключения, альтернативные интерпретации

ОФОРМЛЕНИЕ:
- Используй заголовки (# ## ###) для структуры
- Выделяй ключевые термины **жирным**
- Используй LaTeX для формул: $inline$ и $$block$$
- Callouts для важных замечаний: > [!note], > [!warning], > [!tip]
- Списки для перечислений
- Код-блоки для примеров кода

НАУЧНАЯ ЧЕСТНОСТЬ:
- Признавай границы знания
- Избегай галлюцинаций
- Разделяй: устоявшиеся факты / общепринятые модели / активно исследуемые области
</base_instructions>`;
    }

    buildUserPrompt(topic, size, instructions) {
        const sizeDesc = {
            brief: 'краткий конспект (~5 000 символов) с ключевыми тезисами и определениями',
            medium: 'полноценный конспект (~20 000 символов) с примерами и объяснениями',
            detailed: 'развёрнутый конспект (~40 000 символов) с глубоким разбором механизмов'
        };

        let prompt = `Создай ${sizeDesc[size]} по теме: "${topic}".`;

        if (instructions) {
            prompt += `\n\nДополнительные требования: ${instructions}`;
        }

        return prompt;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}