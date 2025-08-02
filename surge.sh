#!/bin/bash

# Скрипт для деплоя на Surge.sh
echo "🚀 Деплой на Surge.sh..."

# Сборка проекта
npm run build

# Переход в папку dist
cd dist

# Создание файла CNAME (замените на ваш домен)
echo "your-app-name.surge.sh" > CNAME

# Деплой
npx surge . --domain your-app-name.surge.sh

echo "✅ Деплой завершен!"
echo "🌐 Ваш сайт доступен по адресу: https://your-app-name.surge.sh"