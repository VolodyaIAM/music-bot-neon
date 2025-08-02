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

## 📦 Деплой на Vercel

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

#### Шаг 3: Деплой на Vercel
1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub аккаунт
3. Нажмите **"Add New Project"**
4. Выберите ваш репозиторий из списка
5. Настройки проекта:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Шаг 4: Настройка переменных окружения (если нужно)
В настройках проекта на Vercel добавьте переменные:
- `NODE_ENV` = `production`

#### Шаг 5: Деплой
1. Нажмите **"Deploy"**
2. Ждите завершения сборки (обычно 1-3 минуты)
3. Получите ссылку на ваш сайт!

### Автоматические обновления
После первого деплоя каждый push в main ветку будет автоматически обновлять сайт.

## 📦 Альтернативные варианты деплоя

### Netlify

1. Подключите репозиторий к [Netlify](https://netlify.com)
2. Настройки считаются из `netlify.toml`
3. Build command: `npm run build`
4. Publish directory: `dist`

### GitHub Pages

1. Включите GitHub Actions в настройках репозитория
2. Push в main запустит автоматический деплой
3. Сайт будет доступен по адресу `https://yourusername.github.io/repo-name`

### Surge.sh (для быстрого тестирования)

```bash
# Установите surge глобально
npm install -g surge

# Соберите проект
npm run build

# Деплой
cd dist
surge
```

## 🛠️ Технологии

- **Frontend**: React 18, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Анимации**: Motion (Framer Motion)
- **UI Components**: Radix UI
- **Build Tool**: Vite
- **Хостинг**: Vercel/Netlify/GitHub Pages

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
└── public/             # Статические файлы
```

## 🔧 Команды

- `npm run dev` - Запуск dev сервера
- `npm run build` - Сборка для продакшена
- `npm run preview` - Предварительный просмотр сборки
- `npm run type-check` - Проверка типов TypeScript

## 🚨 Важные моменты для деплоя

### Настройка Supabase Edge Functions
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

### Переменные окружения в Supabase
В настройках Edge Functions добавьте:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## 🌐 Рекомендации по хостингу

### Лучшие варианты:

1. **Vercel** ⭐ - Идеален для React приложений
   - Автоматический деплой из GitHub
   - Быстрая глобальная CDN
   - Бесплатный план: до 100GB трафика/месяц

2. **Netlify** - Отличная альтернатива с хорошим CI/CD
   - Простая настройка
   - Встроенные формы и функции
   - Бесплатный план: до 100GB трафика/месяц

3. **GitHub Pages** - Простой вариант для статических сайтов
   - Бесплатно для публичных репозиториев
   - Автоматический деплой через Actions

4. **Surge.sh** - Быстрый деплой одной командой
   - Мгновенный деплой
   - Простота использования

## 📞 Поддержка

Если возникли проблемы с деплоем:
1. Проверьте логи сборки в панели хостинга
2. Убедитесь что все зависимости установлены
3. Проверьте совместимость версий Node.js (требуется >=18.0.0)

## 📝 Лицензия

MIT License - смотрите файл LICENSE для деталей.