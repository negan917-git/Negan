function showConnectModal() {
    document.getElementById('connectModal').classList.add('show');
}

function hideConnectModal() {
    document.getElementById('connectModal').classList.remove('show');
    document.getElementById('connectBotForm').reset();
}

function renderBots(bots) {
    const container = document.getElementById('botsContainer');
    if (!bots || bots.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
                <p>Боты ещё не подключены. Нажмите «Подключить бота», чтобы начать.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = bots.map(bot => `
        <div class="bot-card">
            <div class="bot-card-header">
                <div>
                    <div class="bot-name">${escapeHtml(bot.bot_name)}</div>
                    <div class="bot-username">@${escapeHtml(bot.username)}</div>
                </div>
                <span class="bot-status ${bot.status}">${bot.status}</span>
            </div>
            <div class="bot-stats">
                <div class="bot-stat-item">
                    <div class="number">${bot.messages_count}</div>
                    <div class="label">Синхр. сообщений</div>
                </div>
                <div class="bot-stat-item">
                    <div class="number">${bot.status === 'connected' ? '1' : '0'}</div>
                    <div class="label">Активен</div>
                </div>
            </div>
            <div class="bot-actions">
                <button class="btn btn-primary btn-sm" onclick="syncBot(${bot.id}, this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Синхронизировать
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteBot(${bot.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
}

function loadBots() {
    document.getElementById('botsContainer').innerHTML = '<div class="loading">Загрузка ботов...</div>';
    fetch('/api/bots')
        .then(r => r.json())
        .then(bots => renderBots(bots))
        .catch(() => {
            document.getElementById('botsContainer').innerHTML = '<div class="empty-state"><p>Не удалось загрузить ботов.</p></div>';
        });
}

function syncBot(botId, btnElement) {
    const btn = btnElement || document.querySelector(`button[onclick*="syncBot(${botId})"]`);
    const origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">&#8635;</span> Синхронизация...';

    fetch(`/api/bots/${botId}/sync`, { method: 'POST' })
        .then(r => r.json())
        .then(d => {
            btn.disabled = false;
            btn.innerHTML = origHTML;
            if (d.success) {
                if (d.synced > 0) {
                    showToast(`Синхронизировано ${d.synced} новых сообщений!`, 'success');
                } else {
                    showToast(d.message || 'Новых сообщений нет. Отправьте сообщение боту в Telegram.', 'info');
                }
                loadBots();
            } else {
                showToast(d.message || 'Синхронизация не удалась. Проверьте правильность токена бота.', 'error');
            }
        })
        .catch(() => {
            showToast('Синхронизация не удалась - подробности в консоли', 'error');
            btn.disabled = false;
            btn.innerHTML = origHTML;
        });
}

function deleteBot(botId) {
    if (!confirm('Вы уверены, что хотите удалить этого бота?')) return;

    fetch(`/api/bots/${botId}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                showToast('Бот удалён', 'success');
                loadBots();
            } else {
                showToast(d.message || 'Ошибка удаления', 'error');
            }
        })
        .catch(() => showToast('Ошибка удаления', 'error'));
}

document.getElementById('connectBotForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        bot_name: this.bot_name.value.trim(),
        username: this.username.value.trim().replace('@', ''),
        token: this.token.value.trim()
    };

    if (!data.bot_name || !data.username || !data.token) {
        showToast('Все поля обязательны для заполнения', 'error');
        return;
    }

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Подключение...';

    fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            showToast('Бот подключён!', 'success');
            hideConnectModal();
            loadBots();
        } else {
            showToast(d.message || 'Не удалось подключить бота', 'error');
            btn.disabled = false;
            btn.textContent = 'Сохранить';
        }
    })
    .catch(() => {
        showToast('Не удалось подключить бота', 'error');
        btn.disabled = false;
        btn.textContent = 'Сохранить';
    });
});

document.addEventListener('DOMContentLoaded', loadBots);

document.getElementById('connectModal').addEventListener('click', function(e) {
    if (e.target === this) hideConnectModal();
});
