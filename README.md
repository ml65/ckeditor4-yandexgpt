# CKEditor4 Custom Build

Это кастомная сборка CKEditor4, оптимизированная для использования в проекте Books.

## Особенности

- Оптимизированная конфигурация
- Настроенные стили
- Поддержка плагинов

## Установка

1. Склонируйте репозиторий:
```bash
git clone https://github.com/your-username/ckeditor4-project.git
```

2. Скопируйте содержимое в директорию `public/ckeditor4` вашего проекта.

## Использование

```html
<script src="/ckeditor4/ckeditor.js"></script>
<script>
    CKEDITOR.replace('editor');
</script>
```

## Конфигурация

Основные настройки редактора находятся в файле `config.js`.

## Лицензия

CKEditor4 распространяется под лицензией GPL, LGPL и MPL. Подробности в файле LICENSE.md.
