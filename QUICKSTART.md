# 🚀 Инструкции по запуску UniChat

## Предварительные требования

- Docker и Docker Compose установлены
- Git установлен
- Минимум 2GB свободной памяти
- Портыи 3000, 5173, 6379, 5432 свободны

## ⚡ Быстрый старт (5 минут)

### Шаг 1: Подготовка проекта

```bash
cd /workspaces/QuikGram

# Скопировать конфиг переменных окружения
cp .env.example .env

# Проверить, что Docker запущен
docker --version
docker-compose --version
```

### Шаг 2: Запуск приложения

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

Ожидаемый вывод:
```
NAME                COMMAND             STATUS          PORTS
unichat_postgres   postgres            Up              5432/tcp
unichat_redis      redis-server        Up              6379/tcp
unichat_backend    npm run start:prod  Up              3000/tcp
unichat_frontend   serve -s dist       Up              5173/tcp
```

### Шаг 3: Инициализация БД

```bash
# Создать таблицы
docker-compose exec backend npm run db:migrate

# Проверить логи
docker-compose logs -f backend
```

### Шаг 4: Проверка

Откройте в браузере:
- **Frontend**: http://localhost:5173
- **API docs**: http://localhost:3000/api
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

## 🛑 Остановка и очистка

```bash
# Остановить контейнеры (данные сохранятся)
docker-compose down

# Остановить и удалить всё (включая данные)
docker-compose down -v

# Просмотр размера контейнеров
docker system df
```

## 📊 Мониторинг

```bash
# Реальные логи всех сервисов
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend

# Статистика использования ресурсов
docker stats
```

## 🔧 Разработка

### Локальный запуск backend

```bash
cd backend

# Установить зависимости
npm install

# Запустить dev сервер (с автоперезагрузкой)
npm run start:dev

# Запустить тесты
npm run test

# Linting и форматирование
npm run lint
npm run format
```

### Локальный запуск frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Build для продакшена
npm run build

# Preview
npm run preview
```

## 🐛 Решение проблем

### Ошибка: "Cannot find module"

```bash
# Переустановить зависимости
docker-compose exec backend npm ci
docker-compose exec frontend npm ci
```

### Ошибка: "Port already in use"

```bash
# Найти процесс на порту
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

### БД не инициализирована

```bash
# Пересоздать контейнеры с БД
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run db:migrate
```

### Проблемы с сетью

```bash
# Перезапустить Docker daemon
sudo systemctl restart docker

# Проверить подключение контейнеров
docker-compose exec backend ping redis
docker-compose exec backend ping postgres
```

## 📝 Переменные окружения

Основные переменные в `.env`:

```env
# Database
DB_USER=unichat
DB_PASSWORD=secure_password_123
DB_NAME=unichat_db

# Redis
REDIS_PASSWORD=redis_secure_123

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production_min_32_chars
JWT_EXPIRY=3600

# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## 🔐 Безопасность для продакшена

### Перед публикацией в интернет:

```bash
# 1. Сменить все пароли в .env
RANDOM_PASSWORD=$(openssl rand -base64 32)
echo $RANDOM_PASSWORD

# 2. Сменить JWT секреты
RANDOM_JWT=$(openssl rand -base64 32)
echo $RANDOM_JWT

# 3. Включить HTTPS (Let's Encrypt)
# Раскомментировать HTTPS секцию в nginx.conf
```

### Создать backup скрипт

```bash
mkdir -p /backups/unichat

# backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U unichat unichat_db | gzip > /backups/unichat/db_backup_$DATE.sql.gz
tar -czf /backups/unichat/uploads_backup_$DATE.tar.gz ./backend/uploads/
echo "Backup completed: $DATE"

# Добавить в cron
crontab -e
# 0 2 * * * /path/to/backup.sh  # Каждый день в 2:00 AM
```

## 📈 Масштабирование

### Для 1000+ пользователей:

```bash
# Увеличить параметры PostgreSQL в docker-compose.yml:
environment:
  - POSTGRES_MAX_CONNECTIONS=200
  - shared_buffers=256MB
  - work_mem=4MB

# Увеличить Redis memory:
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru

# Добавить Nginx для балансировки нагрузки
# (раскомментировать в docker-compose.yml)
```

### Мониторинг производительности:

```bash
# Проверить использование памяти
docker stats

# Проверить CPU
top

# Логирование и анализ
docker-compose logs --tail=1000 backend | grep "ERROR\|WARN"
```

## ✅ Чек-лист перед запуском

- [ ] Docker установлен и запущен
- [ ] Скопирован `.env.example` в `.env`
- [ ] Все порты свободны (3000, 5173, 5432, 6379)
- [ ] Достаточно дискового пространства (минимум 5GB)
- [ ] Интернет подключение стабильно
- [ ] Если это продакшен - сменены все пароли
- [ ] Если это продакшен - включен HTTPS

## 📚 Дополнительные ресурсы

- [Docker Compose документация](https://docs.docker.com/compose/)
- [NestJS документация](https://docs.nestjs.com/)
- [React документация](https://react.dev/)
- [Prisma документация](https://www.prisma.io/docs/)

## 🆘 Помощь

Если возникли проблемы:

1. Проверьте логи: `docker-compose logs`
2. Проверьте интернет-соединение
3. Убедитесь, что все сервисы запущены: `docker-compose ps`
4. Попробуйте переустановить зависимости и перезапустить
5. Создайте Issue в репозитории

---

**Happy coding! 🚀**
