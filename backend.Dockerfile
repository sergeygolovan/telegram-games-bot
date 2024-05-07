# устанавливаем официальный образ Node.js
FROM node:18-alpine

# указываем рабочую (корневую) директорию
WORKDIR /app

# копируем основные файлы приложения в рабочую директорию
COPY package.json package-lock.json ./

# устанавливаем указанные зависимости NPM на этапе установки образа
RUN npm install --legacy-peer-deps

# после установки копируем все файлы проекта
COPY ./.env ./
COPY ./prisma/schema.prisma ./prisma/schema.prisma
COPY ./dist ./dist

# инициализируем клиент prisma
RUN npx prisma generate

# запускаем основной скрипт в момент запуска контейнера
CMD npm start