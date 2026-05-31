let charts = {};

function initChart(id, config) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    charts[id] = new Chart(ctx, config);
}

function renderAnalytics(data) {
    if (data.empty) {
        document.querySelector('.analytics-kpis').innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>Данных пока нет. Подключите бота и синхронизируйте сообщения.</p></div>';
        return;
    }

    const k = data.kpis;
    document.getElementById('analyticsTotalMessages').textContent = k.total_messages;
    document.getElementById('analyticsNegativeRate').textContent = k.negative_rate + '%';
    document.getElementById('analyticsComplaintRate').textContent = k.complaint_rate + '%';
    document.getElementById('analyticsActiveBots').textContent = k.active_bots;

    const trend = data.sentiment_trend;
    const labels = trend.map(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    initChart('sentimentTrendChart', {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Позитивный', data: trend.map(t => t.positive), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 3 },
                { label: 'Нейтральный', data: trend.map(t => t.neutral), borderColor: '#94a3b8', backgroundColor: 'rgba(148,163,184,0.1)', fill: true, tension: 0.4, pointRadius: 3 },
                { label: 'Негативный', data: trend.map(t => t.negative), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } } },
            scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
        }
    });

    const emo = data.emotion_breakdown;
    initChart('emotionBreakdownChart', {
        type: 'pie',
        data: {
            labels: Object.keys(emo),
            datasets: [{
                data: Object.values(emo),
                backgroundColor: ['#22c55e', '#94a3b8', '#f59e0b', '#ef4444'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } } }
        }
    });

    const cats = data.category_counts;
    const catLabels = Object.keys(cats);
    const catValues = Object.values(cats);

    initChart('complaintCategoriesChart', {
        type: 'bar',
        data: {
            labels: catLabels,
            datasets: [{
                label: 'Messages',
                data: catValues,
                backgroundColor: ['#2563EB', '#EF4444', '#F59E0B', '#22C55E', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#6366F1', '#A855F7', '#E11D48'],
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } }
            }
        }
    });

    const prio = data.priority_distribution;
    initChart('priorityDistChart', {
        type: 'doughnut',
        data: {
            labels: Object.keys(prio),
            datasets: [{
                data: Object.values(prio),
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } } }
        }
    });

    const mpd = data.messages_per_day;
    const mpdLabels = Object.keys(mpd).sort();
    const mpdValues = mpdLabels.map(d => mpd[d]);

    initChart('messagesPerDayChart', {
        type: 'line',
        data: {
            labels: mpdLabels.map(d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }),
            datasets: [{
                label: 'Messages',
                data: mpdValues,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37,99,235,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#2563EB'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 15 } }
            }
        }
    });

    renderTopCategories(data.top_categories);
    renderTopNegativeUsers(data.top_negative_users);
}

function renderTopCategories(categories) {
    const container = document.getElementById('topCategoriesTable');
    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Нет данных</p></div>';
        return;
    }

    let html = '<table class="data-table"><thead><tr><th>Категория</th><th>Количество</th><th>Процент</th></tr></thead><tbody>';
    categories.forEach(c => {
        html += `<tr><td style="text-transform:capitalize">${c.category}</td><td>${c.count}</td><td>${c.percentage}%</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderTopNegativeUsers(users) {
    const container = document.getElementById('topNegativeUsersTable');
    if (!users || users.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Нет данных</p></div>';
        return;
    }

    let html = '<table class="data-table"><thead><tr><th>Пользователь</th><th>Негативные сообщения</th><th>Жалобы</th></tr></thead><tbody>';
    users.forEach(u => {
        html += `<tr><td>${escapeHtml(u.username)}</td><td>${u.negative_messages}</td><td>${u.complaints}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function loadAnalytics() {
    fetch('/api/analytics/data')
        .then(r => r.json())
        .then(data => renderAnalytics(data))
        .catch(() => showToast('Не удалось загрузить аналитику', 'error'));
}

function exportData(format) {
    window.location.href = `/api/analytics/export/${format}`;
}

function autoSyncBots() {
    fetch('/api/bots/sync-all', { method: 'POST' }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', function() {
    autoSyncBots();
    loadAnalytics();
    setInterval(autoSyncBots, 30000);
});
