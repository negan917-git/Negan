function analyzeMessage() {
    const input = document.getElementById('messageInput');
    const btn = document.getElementById('analyzeBtn');
    const message = input.value.trim();

    if (!message) {
        showToast('Пожалуйста, введите сообщение для анализа', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">&#8635;</span> Анализ...';

    fetch('/api/simulate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            displayResult(data.analysis, data.has_api_key, data.is_default_analysis, data);
        } else {
            showToast(data.message || 'Ошибка анализа', 'error');
        }
    })
    .catch(() => showToast('Ошибка анализа', 'error'))
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Анализировать';
    });
}

function displayResult(analysis, hasApiKey, isDefault, fullData) {
    const card = document.getElementById('resultCard');
    card.style.display = 'block';
    const header = card.querySelector('.card-header h3');

    if (!hasApiKey) {
        header.innerHTML = 'Результат анализа <span style="color:#ef4444;font-size:12px;font-weight:400;margin-left:8px">(Нет API Key)</span>';
    } else if (isDefault) {
        const errorType = analysis._error_type || 'API_ERROR';
        header.innerHTML = `Результат анализа <span style="color:#f59e0b;font-size:12px;font-weight:400;margin-left:8px">(${errorType})</span>`;
    } else {
        header.textContent = 'Результат анализа';
    }

    document.getElementById('resultSentiment').textContent = analysis.sentiment;
    document.getElementById('resultSentiment').style.color = analysis.sentiment === 'positive' ? '#22c55e' : analysis.sentiment === 'negative' ? '#ef4444' : '#94a3b8';

    document.getElementById('resultEmotion').textContent = analysis.emotion;
    const emoColors = { happy: '#22c55e', neutral: '#94a3b8', frustrated: '#f59e0b', angry: '#ef4444' };
    document.getElementById('resultEmotion').style.color = emoColors[analysis.emotion] || '#1e293b';

    document.getElementById('resultComplaint').textContent = analysis.isComplaint ? 'Да' : 'Нет';
    document.getElementById('resultComplaint').style.color = analysis.isComplaint ? '#ef4444' : '#22c55e';

    document.getElementById('resultPriority').textContent = analysis.priority;
    const prioColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
    document.getElementById('resultPriority').style.color = prioColors[analysis.priority] || '#1e293b';

    document.getElementById('resultCategories').textContent = analysis.categories.join(', ');
    document.getElementById('resultSummary').textContent = analysis.summary;

    const existingWarning = document.getElementById('resultWarning');
    if (existingWarning) existingWarning.remove();

    if (!hasApiKey) {
        const warning = document.createElement('div');
        warning.id = 'resultWarning';
        warning.style.cssText = 'background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:18px;font-size:13px;color:#92400e;';
        warning.innerHTML = '<strong>⚠ Gemini API Key не настроен.</strong> AI-анализ возвращает значения по умолчанию. Добавьте ключ в <a href="/settings" style="color:#2563EB;font-weight:600;">Настройки → Настройки AI</a> или укажите его в файле <code style="background:#fef3c7;padding:2px 6px;border-radius:4px;">.env</code>.';
        card.querySelector('.card-body').insertBefore(warning, card.querySelector('.card-body').firstChild);
    } else if (isDefault) {
        const errorMsg = analysis._error_message || 'Unknown API error';
        const errorType = analysis._error_type || 'API_ERROR';
        const warning = document.createElement('div');
        warning.id = 'resultWarning';
        warning.style.cssText = 'background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-bottom:18px;font-size:13px;color:#991b1b;';
        warning.innerHTML = `<strong>❌ ${errorType}</strong><br>${errorMsg}`;
        card.querySelector('.card-body').insertBefore(warning, card.querySelector('.card-body').firstChild);
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/settings/user')
        .then(r => r.json())
        .then(user => {
            if (!user.gemini_api_key) {
                const container = document.querySelector('.simulate-container');
                const banner = document.createElement('div');
                banner.id = 'apiKeyBanner';
                banner.style.cssText = 'grid-column:1/-1;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;font-size:14px;color:#92400e;';
                banner.innerHTML = '<strong>⚠ Gemini API Key не настроен.</strong> AI-анализ будет возвращать значения по умолчанию. Перейдите в <a href="/settings" style="color:#2563EB;font-weight:600;">Настройки → Настройки AI</a> чтобы добавить API ключ, или посетите страницу <a href="/system/diagnostics" style="color:#2563EB;font-weight:600;">Диагностики</a> для устранения неполадок.';
                container.insertBefore(banner, container.firstChild);
            }
        })
        .catch(() => {});
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        analyzeMessage();
    }
});
