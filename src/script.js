// State management
let chatHistory = [];
let uploadedFiles = [];
let messageHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');

const elements = {
    subjectInput: document.getElementById('subjectInput'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    generateBtn: document.getElementById('generateBtn'),
    messages: document.getElementById('messages'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    historyList: document.getElementById('historyList')
};

// Auto-resize textarea
elements.userInput.addEventListener('input', () => {
    elements.userInput.style.height = 'auto';
    elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 100) + 'px';
});

// File handling
elements.fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedFiles.push({
                name: file.name,
                content: event.target.result
            });
            updateFileList();
        };
        reader.readAsText(file);
    });
});

function updateFileList() {
    elements.fileList.innerHTML = uploadedFiles.map((file, idx) => `
        <div class="file-item">
            <span>📄 ${file.name.substring(0, 20)}</span>
            <span class="remove-file" onclick="removeFile(${idx})">✕</span>
        </div>
    `).join('');
}

function removeFile(idx) {
    uploadedFiles.splice(idx, 1);
    updateFileList();
}

// Message rendering
function renderMessage(content, isUser = true) {
    const messagesDiv = elements.messages;
    
    if (messagesDiv.querySelector('.empty-state')) {
        messagesDiv.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    messageDiv.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderLoadingMessage() {
    const messagesDiv = elements.messages;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message loading assistant';
    messageDiv.id = 'loadingMessage';
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeLoadingMessage() {
    const loading = document.getElementById('loadingMessage');
    if (loading) loading.remove();
}

// API calls to Hugging Face Inference API
async function callAI(prompt) {
    try {
        const data = await await query({ 
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "deepseek-ai/DeepSeek-V3.2:novita",
        });

        console.log(data);
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API Error:', error);
        return `❌ Ошибка подключения к ИИ: ${error.message}. Попробуйте позже или перезагрузите страницу.`;
    }
}

async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/v1/chat/completions",
		{
			headers: {
				Authorization: `Bearer ${secrets.HUGGING_FACE_TOKEN}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);

	const result = await response.json();
	return result;
}

// Generate learning program
elements.generateBtn.addEventListener('click', async () => {
    const subject = elements.subjectInput.value.trim();
    if (!subject) {
        alert('Пожалуйста, введите предмет обучения');
        return;
    }

    const outputType = document.querySelector('input[name="outputType"]:checked').value;
    elements.messages.innerHTML = '';

    renderMessage(`Создаю программу обучения по "${subject}" в формате "${getFormatName(outputType)}"...`, true);
    renderLoadingMessage();

    let filesContext = '';
    if (uploadedFiles.length > 0) {
        filesContext = `\n\nЗагруженные материалы:\n${uploadedFiles.map(f => `- ${f.name}: ${f.content.substring(0, 200)}...`).join('\n')}`;
    }

    const prompts = {
        summary: `Создай подробный конспект для обучения по предмету "${subject}". Структурируй информацию с главными темами, ключевыми понятиями и примерами. Язык: русский.${filesContext}`,
        flashcards: `Создай набор карточек для запоминания (в формате "Вопрос | Ответ") по предмету "${subject}". Включи 10-15 карточек с ключевыми терминами и определениями. Язык: русский.${filesContext}`,
        test: `Создай тест с 5 вопросами и вариантами ответов по предмету "${subject}". Язык: русский.${filesContext}`
    };

    const response = await callAI(prompts[outputType]);
    removeLoadingMessage();
    renderMessage(response, false);

    chatHistory.push({
        subject: subject,
        outputType: outputType,
        timestamp: new Date().toLocaleString('ru-RU'),
        response: response
    });

    updateHistory();
});

// Send message
async function sendMessage() {
    const message = elements.userInput.value.trim();
    if (!message || !elements.sendBtn.disabled === false) return;

    renderMessage(message, true);
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';

    const subject = elements.subjectInput.value || 'изучаемый материал';
    const outputType = document.querySelector('input[name="outputType"]:checked').value;

    renderLoadingMessage();

    const prompt = `На основе предмета "${subject}" (формат: ${getFormatName(outputType)}): ${message}`;
    const response = await callAI(prompt);

    removeLoadingMessage();
    renderMessage(response, false);

    chatHistory.push({
        subject: subject,
        message: message,
        response: response,
        timestamp: new Date().toLocaleString('ru-RU')
    });
}

elements.sendBtn.addEventListener('click', sendMessage);
elements.userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// History
function updateHistory() {
    const historyItems = chatHistory.slice(-5).reverse();
    elements.historyList.innerHTML = historyItems.map((item, idx) => `
        <button class="history-item" onclick="loadFromHistory(${chatHistory.length - idx - 1})">
            ${item.subject || item.message.substring(0, 20)}...
        </button>
    `).join('');
}

function loadFromHistory(idx) {
    const item = chatHistory[idx];
    elements.subjectInput.value = item.subject || '';
    elements.messages.innerHTML = '';
    renderMessage(item.message || `Программа по ${item.subject}`, true);
    renderMessage(item.response, false);
}

function getFormatName(type) {
    const names = {
        summary: 'Конспект',
        flashcards: 'Карточки',
        test: 'Тест'
    };
    return names[type];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

updateHistory();