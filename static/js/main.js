function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Только что';
    if (mins < 60) return `${mins} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} д. назад`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
}

function getAvatarColor(name) {
    const colors = ['#2563EB', '#EF4444', '#F59E0B', '#22C55E', '#8B5CF6', '#EC4899', '#06B6D4'];
    let hash = 0;
    for (let i = 0; i < (name || 'U').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function checkApiKey() {
    const existing = document.getElementById('globalApiWarning');
    if (existing) return;

    const hiddenRoutes = ['/login', '/register'];
    if (hiddenRoutes.includes(window.location.pathname)) return;

    fetch('/api/settings/user')
        .then(r => r.json())
        .then(user => {
            if (!user.gemini_api_key) {
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    const banner = document.createElement('div');
                    banner.id = 'globalApiWarning';
                    banner.style.cssText = 'background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 20px;margin-bottom:24px;font-size:13px;color:#92400e;display:flex;align-items:center;gap:12px;flex-wrap:wrap;';
                    banner.innerHTML = '<span style="flex:1"><strong>⚠ Gemini API Key не настроен.</strong> AI-анализ будет показывать значения по умолчанию. Добавьте ключ в <a href="/settings" style="color:#2563EB;font-weight:600;">Настройки → Настройки AI</a> или укажите <code style="background:#fef3c7;padding:2px 6px;border-radius:4px;font-size:12px;">GEMINI_API_KEY</code> в файле <code style="background:#fef3c7;padding:2px 6px;border-radius:4px;font-size:12px;">.env</code>.</span>';
                    mainContent.insertBefore(banner, mainContent.firstChild);
                }
            }
        })
        .catch(() => {});
}

document.addEventListener('DOMContentLoaded', checkApiKey);
