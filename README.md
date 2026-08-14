# UniChat - Secure Web Messenger

Полнофункциональный веб-мессенджер с E2EE шифрованием, предназначенный для безопасной коммуникации пользователей из СНГ.

## 🚀 Основные возможности (MVP)

- ✅ Регистрация по номеру телефона с OTP подтверждением
- ✅ Личные и групповые чаты
- ✅ End-to-End Encryption (E2EE) для секретных чатов
- ✅ Отправка сообщений, фото, видео, файлов
- ✅ Редактирование и удаление сообщений
- ✅ Реакции (эмодзи) на сообщения
- ✅ Статус онлайн/оффлайн
- ✅ WebSocket для realtime обновлений
- ✅ Модерация и антиспам
- ✅ Админка для управления пользователями
- ✅ 2FA аутентификация
- ✅ Блокировка пользователей

## 📋 Требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)
- PostgreSQL 15+
- Redis 7+

## 🏗️ Архитектура

```
┌─────────────────┐
│  React Frontend │  (http://localhost:5173)
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Nginx    │  (Reverse Proxy)
    └────┬──────┘
         │
    ┌────┴──────┬──────────┐
    │            │          │
┌───▼──┐  ┌──────▼──┐  ┌───▼────┐
│API   │  │WebSocket│  │Uploads │
└───┬──┘  └──────┬──┘  └───┬────┘
    │            │         │
    └────┬───────┴────┬────┘
         │            │
    ┌────▼──────┐ ┌──▼────┐
    │NestJS API │ │Storage │
    └────┬──────┘ └──┬────┘
         │           │
    ┌────▼───────┬──▼─────┐
    │ PostgreSQL │ Redis  │
    └────────────┴────────┘
```

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
cd /workspaces/QuikGram
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
# Отредактируйте .env при необходимости
```

### 3. Запуск с Docker Compose

```bash
docker-compose up -d
```

Будут запущены:
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. Инициализация БД

```bash
docker-compose exec backend npm run db:migrate
```

### 5. Проверка статуса

```bash
# Проверить, что все сервисы запущены
docker-compose ps

# Просмотреть логи
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📚 Структура проекта

```
QuikGram/
├── backend/
│   ├── src/
│   │   ├── common/           # Общие модули (encryption, redis, prisma, guards)
│   │   ├── modules/
│   │   │   ├── auth/         # Регистрация, вход, JWT
│   │   │   ├── users/        # Профили, контакты, блокировка
│   │   │   ├── chats/        # Чаты, группы, каналы
│   │   │   ├── messages/     # Сообщения, редактирование, реакции
│   │   │   ├── websocket/    # WebSocket gateway для realtime
│   │   │   ├── moderation/   # Модерация, репорты
│   │   │   └── admin/        # Админка, статистика
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── pages/            # Страницы
│   │   ├── services/         # API и WebSocket клиенты
│   │   ├── stores/           # Zustand state management
│   │   ├── utils/            # Утилиты (шифрование, форматирование)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## 🔐 Безопасность

### E2EE шифрование

- **Алгоритм**: AES-256-GCM
- **Ключевой обмен**: RSA-4096
- **OTP верификация**: 6-значный код, 5 минут TTL
- **Пароли**: PBKDF2 с 100,000 итерациями

### Защита от атак

- ✅ Rate limiting (10 req/minute по умолчанию)
- ✅ Защита от SQL Injection (Prisma ORM)
- ✅ CORS restricted
- ✅ HTTPS/TLS 1.3 (для продакшена)
- ✅ JWT tokens с коротким TTL
- ✅ Helmet для безопасности headers
- ✅ CSRF protection
- ✅ XSS protection через CSP

### Данные пользователей

- Минимальный сбор данных (телефон, имя, фото)
- Пароли хранятся в хеше
- E2EE для секретных чатов
- Возможность удаления профиля

## 📖 API документация

### Аутентификация

```bash
# Регистрация
POST /api/auth/register
{
  "phoneNumber": "+79991234567",
  "password": "SecurePassword123",
  "displayName": "John Doe"
}

# Подтверждение OTP
POST /api/auth/verify-otp
{
  "phoneNumber": "+79991234567",
  "otp": "123456"
}

# Вход
POST /api/auth/login
{
  "phoneNumber": "+79991234567",
  "password": "SecurePassword123"
}

# Обновление токена
POST /api/auth/refresh-token
{
  "refreshToken": "refresh_token_value"
}
```

### Чаты

```bash
# Создать личный чат
POST /api/chats/private/:userId

# Создать групповой чат
POST /api/chats/group
{
  "name": "Group Name",
  "description": "Description",
  "members": ["userId1", "userId2"]
}

# Получить все чаты пользователя
GET /api/chats

# Получить сообщения чата
GET /api/messages/chat/:chatId?page=1
```

### Сообщения

```bash
# Отправить (через WebSocket)
emit('sendMessage', {
  chatId: 'chat-id',
  content: 'Message text',
  encrypted: 'encrypted-content'
})

# Отредактировать
PUT /api/messages/:messageId
{
  "content": "Updated text"
}

# Удалить
DELETE /api/messages/:messageId

# Добавить реакцию
POST /api/messages/:messageId/react
{
  "emoji": "👍"
}
```

## 🔧 Команды разработки

### Backend

```bash
cd backend

# Установка зависимостей
npm install

# Локальный запуск (dev mode)
npm run start:dev

# Лinting
npm run lint

# Тесты
npm run test

# Генерация Prisma Client
npm run db:generate

# Миграции БД
npm run db:migrate

# Reset БД
npm run db:reset
```

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Dev сервер
npm run dev

# Build для продакшена
npm run build

# Preview prodакшена
npm run preview

# Linting
npm run lint
```

## 📦 Развертывание на Ubuntu 22.04

### Подготовка сервера

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
```

### Развертывание приложения

```bash
# Клонировать репозиторий
git clone <repo-url>
cd QuikGram

# Скопировать и отредактировать .env
cp .env.example .env
nano .env

# Запустить контейнеры
docker-compose up -d

# Инициализировать БД
docker-compose exec backend npm run db:migrate

# Проверить статус
docker-compose ps
```

### Настройка HTTPS (Let's Encrypt)

```bash
# Установить Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получить сертификат
sudo certbot certonly --standalone -d your-domain.com

# Обновить nginx.conf с HTTPS
# Раскомментировать HTTPS секцию в nginx.conf
```

### Резервное копирование

```bash
# Скрипт backup.sh
#!/bin/bash
BACKUP_DIR="/backups/unichat"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup БД
docker-compose exec -T postgres pg_dump -U unichat unichat_db > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup файлов
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" ./backend/uploads/

# Удалить старые бэкапы (старше 30 дней)
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

## 📊 Мониторинг и логирование

### Просмотр логов

```bash
# Логи backend
docker-compose logs -f backend

# Логи frontend
docker-compose logs -f frontend

# Логи PostgreSQL
docker-compose logs -f postgres

# Логи Redis
docker-compose logs -f redis
```

### Структурированное логирование

Backend использует Pino для JSON-логирования:

```javascript
logger.info({
  userId: '123',
  action: 'login',
  ip: '192.168.1.1',
  timestamp: new Date(),
});
```

## 🐛 Решение проблем

### БД не инициализирована

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run db:migrate
```

### Порты уже в использовании

```bash
# Найти процесс на порту 3000
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

### Очистить Docker

```bash
# Очистить контейнеры и volumes
docker-compose down -v

# Очистить images
docker image prune -a
```

## 📝 Лицензия

MIT

## 🤝 Вклад

Приложения к проекту приветствуются! Пожалуйста, создавайте Pull Request.

## 📧 Поддержка

Для вопросов и проблем создавайте Issues в репозитории.

---

**Важно**: Перед публичным развертыванием обязательно проведите полную юридическую проверку соответствия законодательству РФ и других стран СНГ.
