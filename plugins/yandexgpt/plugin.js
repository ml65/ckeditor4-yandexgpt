(function() {
    CKEDITOR.plugins.add('yandexgpt', {
        icons: 'yandexgpt',
        init: function(editor) {
            // Добавляем команду
            editor.addCommand('yandexGptCommand', {
                exec: function(editor) {
                    var selectedText = editor.getSelection().getSelectedText();
                    if (!selectedText) {
                        alert('Пожалуйста, выделите текст для обработки.');
                        return;
                    }
                    editor.openDialog('yandexGptDialog');
                }
            });

            // Добавляем кнопку в тулбар
            editor.ui.addButton('YandexGpt', {
                label: 'Обработать с Yandex GPT',
                command: 'yandexGptCommand',
                toolbar: 'tools',
                icon: this.path + 'icons/yandexgpt.png'
            });

            // Определяем диалоговое окно
            CKEDITOR.dialog.add('yandexGptDialog', function(editor) {
                var lastSelectedText = '';
                return {
                    title: 'Yandex GPT',
                    minWidth: 800,
                    minHeight: 250,
                    contents: [
                        {
                            id: 'tab1',
                            label: 'Настройки',
                            elements: [
                                {
                                    type: 'select',
                                    id: 'model',
                                    label: 'Модель Yandex GPT',
                                    items: [
                                        ['YandexGPT', 'yandexgpt'],
                                        ['YandexGPT Lite', 'yandexgpt-lite'],
                                        ['YandexGPT Pro', 'yandexgpt-pro']
                                    ],
                                    default: 'yandexgpt'
                                },
                                {
                                    type: 'select',
                                    id: 'action',
                                    label: 'Действие',
                                    items: [
                                        ['Свободный режим','default'],
                                        ['Проверить грамматику', 'check-grammar'],
                                        ['Проверить орфографию', 'check-spelling'],
                                        ['Проверить пунктуацию', 'check-punctuation'],
                                        ['Перефразировать', 'paraphrase'],
                                        ['Упростить', 'simplify'],
                                        ['Расширить', 'expand']
                                    ],
                                    default: 'default'
                                },
                                {
                                    type: 'textarea',
                                    id: 'prompt',
                                    label: 'Промпт',
                                    rows: 6
                                },
                                {
                                    type: 'button',
                                    id: 'processBtn',
                                    label: 'Обработать',
                                    title: 'Обработать текст',
                                    className: 'rs-btn _orange',
                                    onClick: function() {
                                        var dialog = this.getDialog();
                                        var model = dialog.getValueOf('tab1', 'model');
                                        var action = dialog.getValueOf('tab1', 'action');
                                        var prompt = dialog.getValueOf('tab1', 'prompt');
                                        var selection = editor.getSelection();
                                        var selectedText = selection ? selection.getSelectedText() : '';
                                     
                                        try {
                                            const data = getDataSync('/api/yandex-gpt/ballance');
                                            console.log(data.ballance);
                                            if (data.ballance <= 0) {
                                                alert('Недостаточно средств на балансе ' + data.ballance/100 + ' руб.');
                                                return;
                                            }
                                        } catch (error) {
                                            alert('Ошибка: ' + error.message);
                                            return;
                                        }

                                        if (!selectedText) {
                                            alert('Пожалуйста, выделите текст для обработки.');
                                            return;
                                        }
                                        lastSelectedText = selectedText;
                                        try {
                                            const token = getAuthToken();
                                            // Показываем overlay и блокируем элементы
                                            showLoadingOverlay();
                                            setDialogElementsDisabled(dialog, true);
                                            fetch('/api/yandex-gpt/process', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': 'Bearer ' + token
                                                },
                                                body: JSON.stringify({
                                                    text: selectedText,
                                                    model: model,
                                                    action: action,
                                                    prompt: prompt
                                                })
                                            })
                                            .then(response => {
                                                if (response.status === 401) {
                                                    throw new Error('Требуется аутентификация');
                                                }
                                                return response.json();
                                            })
                                            .then(data => {
                                                if (data.status === 'success') {
                                                    dialog.setValueOf('tab1', 'result', data.result);
                                                } else {
                                                    alert('Ошибка: ' + data.error);
                                                }
                                            })
                                            .catch(error => {
                                                alert('Ошибка: ' + error.message);
                                            })
                                            .finally(() => {
                                                // Скрываем overlay и разблокируем элементы
                                                hideLoadingOverlay();
                                                setDialogElementsDisabled(dialog, false);
                                            });
                                        } catch (error) {
                                            alert('Ошибка аутентификации: ' + error.message);
                                            hideLoadingOverlay();
                                            setDialogElementsDisabled(dialog, false);
                                        }
                                    }
                                },
                                {
                                    type: 'textarea',
                                    id: 'result',
                                    label: 'Результат',
                                    rows: 10,
                                    setup: function(widget) {
                                        this.setValue('');
                                    }
                                }
                            ]
                        }
                    ],
                    onShow: function() {
                        // Сохраняем выделенный текст для дальнейшей вставки
                        var selection = editor.getSelection();
                        lastSelectedText = selection ? selection.getSelectedText() : '';
                        this.setValueOf('tab1', 'result', '');
                    },
                    onOk: function() {
                        var result = this.getValueOf('tab1', 'result');
                        if (result) {
                            // Заменяем выделенный текст на результат
                            editor.insertText(result);
                        }
                    }
                };
            });
        }
    });

    // Функция для получения токена
    function getAuthToken() {
        const token = document.querySelector('meta[name="api-token"]')?.getAttribute('content');
        if (!token) {
            throw new Error('Токен аутентификации не найден');
        }
        return token;
    }

    function getDataSync(url) {
        let result;
        let request = new XMLHttpRequest();
        request.open('GET', url, false); // false делает запрос синхронным
        request.send();
        if (request.status === 200) {
            result = request.responseText;
        } else {
            throw new Error('Ошибка: ' + request.status);
        }
        return JSON.parse(result);
    }

    function showLoadingOverlay() {
        var dialogEl = document.querySelector('.cke_dialog');
        if (!dialogEl) return;
        var overlay = document.createElement('div');
        overlay.id = 'yandexgpt-loading-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(255,255,255,0.8)';
        overlay.style.zIndex = 9999;
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.innerHTML = '<img src="/ckeditor4/plugins/yandexgpt/icons/yandexgpt.gif" style="width:100px;height:100px;border-radius:50%;">';
        dialogEl.appendChild(overlay);
    }

    function hideLoadingOverlay() {
        var overlay = document.getElementById('yandexgpt-loading-overlay');
        if (overlay) overlay.remove();
    }

    function setDialogElementsDisabled(dialog, disabled) {
        // Получаем iframe с содержимым диалога
        var iframe = document.querySelector('.cke_dialog_ui_iframe');
        var doc = iframe ? iframe.contentWindow.document : null;
        if (!doc) return;
        var elements = doc.querySelectorAll('select, textarea, button');
        elements.forEach(function(el) {
            // Не блокируем кнопку "Отмена"
            if (el.innerText && el.innerText.trim() === 'Отмена') return;
            el.disabled = disabled;
        });
    }
})();