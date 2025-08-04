# 🎵 Неоновая Музыка

Социальная музыкальная платформа в неоновых тонах с интеграцией Supabase для облачного хранения аудиофайлов и пользовательских данных.

## ✨ Функции

- 🔐 Регистрация и авторизация пользователей
- 👥 Создание профилей музыкантов
- 🎶 Загрузка и хранение аудиотреков
- 🖼️ Галерея профилей других пользователей
- 🎧 Встроенный музыкальный плеер
- 📱 Адаптивный дизайн
- 🌈 Неоновая стилистика с анимированными градиентами

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd neon-music-platform

# Установите зависимости
npm install

# Запустите dev сервер
npm run dev
```

### Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Получите Project ID и Anon Key
3. Обновите файл `/utils/supabase/info.tsx` с вашими данными
4. Настройте Edge Functions в Supabase (код в `/supabase/functions/server/`)

## 🌐 Деплой на Netlify

Приложение оптимизировано для деплоя на Netlify:

### Пошаговая инструкция:

#### Шаг 1: Подготовка кода
```bash
# Убедитесь что всё работает локально
npm run build
npm run preview
```

#### Шаг 2: Создание репозитория на GitHub
1. Создайте новый репозиторий на [GitHub](https://github.com)
2. Загрузите код:
```bash
git init
git add .
git commit -m "Initial commit: Neon Music Platform"
git remote add origin https://github.com/ваш-username/ваш-репозиторий.git
git push -u origin main
```

#### Шаг 3: Деплой на Netlify
1. Перейдите на [netlify.com](https://www.netlify.com)
2. Войдите через GitHub аккаунт
3. Нажмите **"Add new site"** → **"Import an existing project"**
4. Выберите **"Deploy with GitHub"**
5. Найдите ваш репозиторий и нажмите **"Deploy site"**

**Всё!** Netlify автоматически определит настройки из `netlify.toml`.

### Автоматические обновления
После первого деплоя каждый push в main ветку будет автоматически обновлять сайт.

## 🛠️ Технологии

- **Frontend**: React 18, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Анимации**: Motion (Framer Motion)
- **UI Components**: Radix UI
- **Build Tool**: Vite
- **Хостинг**: Netlify

## 📁 Структура проекта

```
├── components/          # React компоненты
│   ├── ui/             # UI компоненты (shadcn)
│   └── ...             # Основные компоненты
├── supabase/
│   └── functions/      # Edge Functions
├── utils/
│   └── supabase/       # Клиент и конфигурация
├── styles/             # CSS стили
├── netlify.toml        # Конфигурация Netlify
└── public/             # Статические файлы
```

## 🔧 Команды

- `npm run dev` - Запуск dev сервера
- `npm run build` - Сборка для продакшена
- `npm run preview` - Предварительный просмотр сборки
- `npm run type-check` - Проверка типов TypeScript

## 🚨 Настройка Supabase Edge Functions

После деплоя фронтенда, настройте серверную часть в Supabase:

1. Установите Supabase CLI:
```bash
npm install -g supabase
```

2. Войдите в аккаунт:
```bash
supabase login
```

3. Деплой функций:
```bash
supabase functions deploy make-server-0daa964a --project-ref ваш-project-id
```

## 📖 Документация

- 📋 **Полная инструкция**: [ДЕПЛОЙ_ИНСТРУКЦИЯ.md](ДЕПЛОЙ_ИНСТРУКЦИЯ.md)
- 🎯 **Быстрая справка**: [ШПАРГАЛКА.md](ШПАРГАЛКА.md)

## 🌟 Особенности Netlify деплоя

✅ **Автоматическое определение Vite проекта**  
✅ **Мгновенные превью для веток**  
✅ **Автоматический HTTPS**  
✅ **Глобальная CDN**  
✅ **Атомарные деплои**

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте [ШПАРГАЛКА.md](ШПАРГАЛКА.md) - там решения типичных проблем
2. Смотрите логи сборки в Netlify Dashboard
3. Убедитесь что Node.js версии >=18.0.0

## 📝 Лицензия

MIT License - смотрите файл LICENSE для деталей.