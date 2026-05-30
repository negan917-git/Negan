let sentimentChartInstance = null;
let emotionChartInstance = null;

function initSentimentChart(data) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    if (sentimentChartInstance) sentimentChartInstance.destroy();
    sentimentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Позитивный', 'Нейтральный', 'Негативный'],
            datasets: [{
                data: [data.positive, data.neutral, data.negative],
                backgroundColor: ['#22c55e', '#94a3b8', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        font: { family: 'Inter', size: 12 }
                    }
                }
            }
        }
    });
}

function initEmotionChart(data) {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    if (emotionChartInstance) emotionChartInstance.destroy();
    emotionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Счастлив', 'Нейтрален', 'Раздражён', 'Зол'],
            datasets: [{
                label: 'Сообщения',
                data: [data.happy, data.neutral, data.frustrated, data.angry],
                backgroundColor: ['#22c55e', '#94a3b8', '#f59e0b', '#ef4444'],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    ticks: { font: { family: 'Inter', size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderRecentMessages(messages) {
    const container = document.getElementById('recentMessages');
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Сообщений пока нет. Подключите бота, чтобы начать.</p></div>';
        return;
    }

    container.innerHTML = messages.map(msg => {
        const badges = [];
        if (msg.sentiment) badges.push(`<span class="badge ${msg.sentiment}">${msg.sentiment}</span>`);
        if (msg.emotion) badges.push(`<span class="badge ${msg.emotion}">${msg.emotion}</span>`);
        if (msg.is_complaint) badges.push(`<span class="badge complaint">жалоба</span>`);
        if (msg.priority) badges.push(`<span class="badge ${msg.priority}">${msg.priority}</span>`);
        const summary = msg.summary && msg.summary !== 'Unable to analyze message.' ? msg.summary : '';

        return `
            <div class="message-card" style="margin-bottom:10px;padding:16px 20px;">
                <div class="message-header">
                    <div class="message-avatar" style="background:${getAvatarColor(msg.username)}">${getInitials(msg.username)}</div>
                    <div class="message-user-info">
                        <div class="message-username">${escapeHtml(msg.username)}</div>
                    </div>
                    <span class="message-date">${formatDate(msg.created_at)}</span>
                </div>
                <div class="message-text">${escapeHtml(msg.message_text)}</div>
                ${summary ? `<div class="message-summary">${escapeHtml(summary)}</div>` : ''}
                <div class="message-badges">${badges.join('')}</div>
            </div>
        `;
    }).join('');
}

function autoSyncBots() {
    fetch('/api/bots/sync-all', { method: 'POST' })
        .then(r => r.json())
        .then(d => {
            if (d.success && d.total_synced > 0) {
                if (document.querySelector('.page-title')?.textContent === 'Dashboard') {
                    showToast(`Синхронизировано ${d.total_synced} новых сообщений`, 'info');
                }
            }
        })
        .catch(() => {});
}

function loadDashboard() {
    document.getElementById('totalMessages').textContent = '...';
    document.getElementById('negativePercent').textContent = '...';
    document.getElementById('complaints').textContent = '...';
    document.getElementById('activeBots').textContent = '...';

    fetch('/api/dashboard/stats')
        .then(r => r.json())
        .then(d => {
            document.getElementById('totalMessages').textContent = d.total_messages;
            document.getElementById('negativePercent').textContent = d.negative_percent + '%';
            document.getElementById('complaints').textContent = d.complaints;
            document.getElementById('activeBots').textContent = d.active_bots;
            initSentimentChart(d.sentiment_distribution);
            initEmotionChart(d.emotion_distribution);
            renderRecentMessages(d.recent_messages);
        })
        .catch(() => {
            document.getElementById('totalMessages').textContent = '0';
            document.getElementById('negativePercent').textContent = '0%';
            document.getElementById('complaints').textContent = '0';
            document.getElementById('activeBots').textContent = '0';
        });
}

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setInterval(autoSyncBots, 30000);
});
