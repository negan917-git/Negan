document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('tab-' + this.dataset.tab).classList.add('active');
        });
    });

    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            name: this.name.value.trim(),
            email: this.email.value.trim()
        };
        fetch('/api/settings/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(d => {
            if (d.success) showToast('Профиль обновлён!', 'success');
            else showToast(d.message, 'error');
        })
        .catch(() => showToast('Не удалось обновить профиль', 'error'));
    });

    document.getElementById('securityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            current_password: this.current_password.value,
            new_password: this.new_password.value,
            confirm_password: this.confirm_password.value
        };
        fetch('/api/settings/security', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                showToast('Пароль изменён!', 'success');
                this.reset();
            } else {
                showToast(d.message, 'error');
            }
        })
        .catch(() => showToast('Не удалось изменить пароль', 'error'));
    });

    document.getElementById('aiForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            gemini_api_key: this.gemini_api_key.value.trim(),
            gemini_model: this.gemini_model.value
        };
        fetch('/api/settings/ai', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(d => {
            if (d.success) showToast('Настройки AI сохранены!', 'success');
            else showToast(d.message, 'error');
        })
        .catch(() => showToast('Не удалось сохранить настройки AI', 'error'));
    });

    document.getElementById('notificationsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            email_notifications: this.email_notifications.checked,
            complaint_alerts: this.complaint_alerts.checked,
            high_priority_alerts: this.high_priority_alerts.checked
        };
        fetch('/api/settings/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(d => {
            if (d.success) showToast('Предпочтения сохранены!', 'success');
            else showToast(d.message, 'error');
        })
        .catch(() => showToast('Не удалось сохранить предпочтения', 'error'));
    });
});

function uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    fetch('/api/settings/avatar', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            document.getElementById('avatarPreview').src = d.avatar + '?t=' + Date.now();
            showToast('Аватар обновлён!', 'success');
        } else {
            showToast(d.message, 'error');
        }
    })
    .catch(() => showToast('Не удалось загрузить аватар', 'error'));
}

function testGeminiConnection() {
    const btn = document.getElementById('testGeminiBtn');
    const resultDiv = document.getElementById('geminiTestResult');
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">&#8635;</span> Тестирование...';
    resultDiv.style.display = 'none';

    fetch('/api/test-gemini', { method: 'POST' })
        .then(r => r.json())
        .then(d => {
            btn.disabled = false;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> Test Gemini Connection';
            resultDiv.style.display = 'block';

            if (d.success) {
                resultDiv.innerHTML = `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;font-size:13px;color:#166534;">
                    <strong>✅ Подключение успешно!</strong><br>
                    Модель: ${d.model || 'N/A'}<br>
                    Ответ: ${d.response || 'OK'}
                </div>`;
                showToast('Подключение к Gemini успешно!', 'success');
            } else {
                const errorType = d.error_type || 'UNKNOWN';
                resultDiv.innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;font-size:13px;color:#991b1b;">
                    <strong>❌ Ошибка подключения</strong><br>
                    Ошибка: ${d.message}<br>
                    Тип: ${errorType}
                </div>`;
                showToast('Ошибка подключения Gemini: ' + d.message, 'error');
            }
        })
        .catch(() => {
            btn.disabled = false;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> Тест Gemini подключения';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;font-size:13px;color:#991b1b;">
                <strong>❌ Сетевая ошибка</strong><br>
                Не удалось подключиться к серверу. Проверьте подключение к интернету.
            </div>`;
        });
}
