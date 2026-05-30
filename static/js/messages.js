let currentPage = 1;
let searchTimeout = null;

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadMessages();
    }, 400);
}

function renderMessages(data) {
    const container = document.getElementById('messagesContainer');
    const pagination = document.getElementById('pagination');

    if (!data.messages || data.messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Сообщения не найдены.</p></div>';
        pagination.innerHTML = '';
        return;
    }

    container.innerHTML = data.messages.map(msg => {
        const badges = [];
        if (msg.sentiment) badges.push(`<span class="badge ${msg.sentiment}">${msg.sentiment}</span>`);
        if (msg.emotion) badges.push(`<span class="badge ${msg.emotion}">${msg.emotion}</span>`);
        if (msg.is_complaint) badges.push(`<span class="badge complaint">жалоба</span>`);
        if (msg.priority) badges.push(`<span class="badge ${msg.priority} priority">${msg.priority} приоритет</span>`);
        if (msg.categories) {
            msg.categories.forEach(cat => {
                badges.push(`<span class="badge ${cat.replace(/\s+/g, '-')}">${cat}</span>`);
            });
        }

        return `
            <div class="message-card">
                <div class="message-header">
                    <div class="message-avatar" style="background:${getAvatarColor(msg.username)}">${getInitials(msg.username)}</div>
                    <div class="message-user-info">
                        <div class="message-username">${escapeHtml(msg.username)}</div>
                        <div class="message-user-handle">@${escapeHtml(msg.telegram_user_id)}</div>
                    </div>
                    <span class="message-date">${formatDate(msg.created_at)}</span>
                </div>
                <div class="message-text">${escapeHtml(msg.message_text)}</div>
                ${msg.summary ? `<div class="message-summary">${escapeHtml(msg.summary)}</div>` : ''}
                <div class="message-badges">${badges.join('')}</div>
            </div>
        `;
    }).join('');

    renderPagination(data.page, data.pages, data.total);
}

function renderPagination(page, pages, total) {
    const container = document.getElementById('pagination');
    if (pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<span style="font-size:12px;color:var(--text-secondary);margin-right:12px">${total} сообщений</span>`;
    html += `<button class="page-btn" onclick="goToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>Назад</button>`;

    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);

    if (start > 1) {
        html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (start > 2) html += `<span class="page-btn" style="border:none;cursor:default">...</span>`;
    }

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (end < pages) {
        if (end < pages - 1) html += `<span class="page-btn" style="border:none;cursor:default">...</span>`;
        html += `<button class="page-btn" onclick="goToPage(${pages})">${pages}</button>`;
    }

    html += `<button class="page-btn" onclick="goToPage(${page + 1})" ${page >= pages ? 'disabled' : ''}>Вперёд</button>`;
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadMessages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '<div class="loading">Загрузка сообщений...</div>';

    const params = new URLSearchParams({
        page: currentPage,
        search: document.getElementById('searchInput').value.trim(),
        sentiment: document.getElementById('sentimentFilter').value,
        priority: document.getElementById('priorityFilter').value,
        category: document.getElementById('categoryFilter').value
    });

    fetch(`/api/messages?${params}`)
        .then(r => r.json())
        .then(data => renderMessages(data))
        .catch(() => {
            container.innerHTML = '<div class="empty-state"><p>Не удалось загрузить сообщения.</p></div>';
        });
}

function autoSyncBots() {
    fetch('/api/bots/sync-all', { method: 'POST' }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', function() {
    autoSyncBots();
    loadMessages();
    setInterval(autoSyncBots, 30000);
});
