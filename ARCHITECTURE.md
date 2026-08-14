# 📐 Архитектура UniChat

## Системная архитектура

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Internet / Users                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Nginx Reverse Proxy   │
                    │  (HTTPS/TLS 1.3)        │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────┐          ┌────────▼────────┐      ┌───────▼────┐
   │Frontend  │          │  Backend API    │      │  Uploads   │
   │React     │          │  NestJS         │      │  Storage   │
   │TypeScript│          │                 │      │  /uploads/ │
   └────┬────┘          └────────┬────────┘      └───────┬────┘
        │                        │                        │
        │             ┌──────────┴─────────┐              │
        │             │                    │              │
   ┌────▼─────────────▼────┐   ┌─────────▼──────────┐    │
   │  WebSocket (Socket.IO) │   │  REST API (HTTP)   │    │
   │  Realtime Messages     │   │  /api/*            │    │
   └────┬──────────────────┘   └────────┬───────────┘    │
        │                               │                 │
        └───────────────┬─────────────────────────────────┘
                        │
        ┌───────────────▼──────────────────┐
        │   Docker Network (unichat_net)   │
        └───────────────┬──────────────────┘
                        │
        ┌───────────────┼────────────────────┐
        │               │                    │
   ┌────▼─────┐   ┌─────▼────┐   ┌──────────▼───┐
   │PostgreSQL │   │  Redis   │   │   File      │
   │Database   │   │  Cache   │   │   Storage   │
   │           │   │  Queue   │   │             │
   │ • Users   │   │ • Tokens │   │ • Photos    │
   │ • Messages│   │ • Sessions│  │ • Videos    │
   │ • Chats   │   │ • Rate   │   │ • Audios    │
   │ • Blocks  │   │   Limit  │   │ • Files     │
   └───────────┘   └──────────┘   └─────────────┘
```

## Компонентная архитектура Backend

```
NestJS Application
├── Middleware
│   ├── CORS
│   ├── Rate Limiting
│   ├── Helmet (Security Headers)
│   └── Request Logging
│
├── Modules
│   ├── Auth
│   │   ├── Controller (Register, Login, Refresh)
│   │   ├── Service (OTP, JWT)
│   │   ├── Strategies (JWT)
│   │   └── Guards (JwtAuthGuard)
│   │
│   ├── Users
│   │   ├── Controller (Profile, Contacts, Block)
│   │   ├── Service (CRUD User operations)
│   │   └── DTOs (Validation)
│   │
│   ├── Chats
│   │   ├── Controller (Create, Get, Update)
│   │   ├── Service (Group management)
│   │   ├── WebSocket integration
│   │   └── DTOs
│   │
│   ├── Messages
│   │   ├── Controller (Crud messages)
│   │   ├── Service (Encryption, Reactions)
│   │   └── WebSocket listeners
│   │
│   ├── Moderation
│   │   ├── Controller (Reports)
│   │   ├── Service (Block, Ban, Review)
│   │   └── Audit logging
│   │
│   ├── Admin
│   │   ├── Controller (Stats, Logs)
│   │   └── Service (Analytics)
│   │
│   └── WebSocket
│       ├── Gateway (Socket.IO)
│       ├── Event Listeners
│       └── Broadcasting
│
└── Common
    ├── Prisma (ORM)
    │   └── PrismaService
    │
    ├── Encryption
    │   ├── E2EE (AES-256-GCM)
    │   ├── RSA (Key Exchange)
    │   ├── OTP generation
    │   └── Password hashing
    │
    ├── Redis
    │   ├── Cache
    │   ├── Sessions
    │   ├── Rate Limiting
    │   └── Queue (Bull)
    │
    ├── Guards
    │   └── JwtAuthGuard
    │
    ├── Decorators
    │   ├── Auth
    │   └── Roles
    │
    └── Middleware
        ├── Error handling
        └── Request logging
```

## Архитектура Frontend

```
React Application (Vite)
├── Components
│   ├── Auth
│   │   ├── LoginForm
│   │   └── RegisterForm
│   │
│   ├── Chat
│   │   ├── ChatList
│   │   ├── ChatWindow
│   │   ├── MessageList
│   │   ├── MessageInput
│   │   └── UserStatus
│   │
│   ├── Profile
│   │   ├── ProfileCard
│   │   ├── EditProfile
│   │   └── BlockedUsers
│   │
│   └── Admin
│       ├── UserManagement
│       ├── Statistics
│       └── Moderation
│
├── Pages
│   ├── LoginPage
│   ├── ChatPage
│   ├── ProfilePage
│   └── AdminPage
│
├── Services
│   ├── api.ts (Axios instance)
│   ├── websocket.ts (Socket.IO)
│   └── encryption.ts (E2EE)
│
├── Stores (Zustand)
│   ├── authStore (User, tokens)
│   ├── chatStore (Chats, messages)
│   ├── userStore (Profile, contacts)
│   └── uiStore (Theme, notifications)
│
├── Utils
│   ├── encryption (Crypto-JS)
│   ├── formatting (Date, text)
│   ├── validation
│   └── constants
│
└── Hooks
    ├── useAuth
    ├── useChat
    ├── useWebSocket
    └── useEncryption
```

## Поток данных сообщений

```
User Input
    │
    ▼
Message Component
    │
    ├─► Encrypt (if E2EE)
    │   └─► AES-256-GCM
    │
    ▼
WebSocket Event
    │
    ▼
Backend WebSocket Gateway
    │
    ├─► Validate User
    ├─► Validate Chat Membership
    ├─► Store in Database
    │   └─► Message table
    │
    ▼
Broadcast to Chat Members
    │
    └─► All connected clients in chat:* room
        │
        ├─► Decrypt (if E2EE)
        │
        └─► Display in Chat UI
```

## Поток аутентификации

```
User Registration
    │
    ├─► Input: Phone Number + Password
    │
    ▼
Validate Input
    │
    ├─► Phone number format
    ├─► Password strength (min 8 chars)
    │
    ▼
Check if User Exists
    │
    ├─► Query: SELECT * FROM users WHERE phoneNumber = ?
    │
    ▼
Hash Password (PBKDF2)
    │
    ├─► 100,000 iterations
    ├─► Generate salt
    │
    ▼
Create User Record
    │
    ▼
Generate OTP
    │
    ├─► 6-digit random code
    ├─► Store in Redis (5 min TTL)
    ├─► Send via SMS (mock in dev)
    │
    ▼
User Confirms OTP
    │
    ├─► Verify against Redis
    ├─► Delete from Redis
    │
    ▼
Generate Tokens
    │
    ├─► Access Token (JWT, 1 hour)
    ├─► Refresh Token (JWT, 7 days)
    ├─► Store session in DB
    │
    ▼
Return to Client
    │
    └─► { accessToken, refreshToken, expiresIn }
```

## E2EE Encryption Flow

```
Sender Encrypts Message
    │
    ├─► Get recipient's public key
    │   └─► Query: SELECT publicKey FROM users WHERE id = ?
    │
    ├─► Generate ephemeral session key
    │   └─► Shared secret: ECDH or RSA-based
    │
    ├─► Encrypt message content
    │   ├─► Algorithm: AES-256-GCM
    │   ├─► IV: Random 16 bytes
    │   ├─► Generate Auth Tag
    │   │
    │   └─► Output: { iv, encrypted, authTag }
    │
    ▼
Send Encrypted Data
    │
    ├─► WebSocket or HTTP
    ├─► Server stores encrypted blob
    │   └─► Cannot read content
    │
    ▼
Recipient Receives
    │
    ├─► Download encrypted message
    ├─► Use private key to decrypt session key
    │
    ▼
Decrypt on Client
    │
    ├─► Extract: { iv, encrypted, authTag }
    ├─► Verify Auth Tag
    │   └─► Protect from tampering
    │
    ├─► Decrypt with session key
    │   └─► Algorithm: AES-256-GCM
    │
    ▼
Display Plaintext
    │
    └─► Only on recipient's device
```

## Модерация и Антиспам

```
Message Flow with Moderation
    │
    ▼
User sends message
    │
    ▼
Check Rate Limits
    │
    ├─► Redis: INCR user:messageCount:hourly
    ├─► Threshold: 100 messages/hour (configurable)
    ├─► Block if exceeded
    │
    ▼
Content Analysis
    │
    ├─► Check for spam patterns
    ├─► Check blacklisted words
    │   └─► Regex or Trie-based matching
    │
    ├─► If flagged:
    │   └─► Store in moderation queue
    │       └─► ModerationLog table
    │
    ▼
Store Message
    │
    ├─► If approved: Direct delivery
    ├─► If flagged: Pending approval
    │
    ▼
Admin Review
    │
    ├─► Dashboard shows pending messages
    ├─► Moderator decides: Approve or Delete
    ├─► Log action in AuditLog
    │
    └─► Notify user if deleted
```

## Масштабирование архитектуры

```
Текущая архитектура (Monolithic):
┌──────────────────────────────────┐
│  Frontend                        │
│  Backend (All Services)          │
│  Single Database                 │
│  Single Redis                    │
└──────────────────────────────────┘

Для 10,000+ пользователей:
┌─────────────────────────────────────────────────────────┐
│              Kubernetes Cluster                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │Frontend Pods │  │Backend Pods  │  │Cache Pods   │   │
│  │  (replicas)  │  │ (replicas)   │  │(Redis HA)   │   │
│  └──────────────┘  └──────────────┘  └─────────────┘   │
│         │                 │                  │          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PostgreSQL (Multi-master replication)    │  │
│  └──────────────────────────────────────────────────┘  │
│         │                 │                  │          │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Load Balancer (Nginx/Traefik)                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Безопасность по слоям

```
Layer 1: Network
├─► TLS 1.3 encryption
├─► HTTPS only
├─► Rate limiting (nginx)
└─► Firewall rules

Layer 2: API
├─► CORS restrictions
├─► CSRF protection
├─► Input validation
├─► Request logging
└─► Error masking

Layer 3: Authentication
├─► JWT tokens (short TTL)
├─► Refresh token rotation
├─► 2FA / MFA
├─► Session tracking
└─► IP/Device fingerprinting

Layer 4: Authorization
├─► Role-based access control (RBAC)
├─► Resource ownership checks
├─► Chat membership validation
└─► Permission checks

Layer 5: Data
├─► E2EE encryption
├─► Encrypted passwords (PBKDF2)
├─► Minimal data collection
├─► Data minimization
└─► GDPR compliance

Layer 6: Logging & Audit
├─► All actions logged
├─► Sensitive data masked
├─► Immutable audit logs
└─► Regular security reviews
```

## База данных - ERD (Entity Relationship Diagram)

```
User (1) ──────────► (N) Chat (Many-to-Many via ChatUser)
  │
  ├─► (1) Contact (N)
  │
  ├─► (1) BlockedUser (N)
  │
  ├─► (1) Message (N)
  │
  ├─► (1) Session (N)
  │
  └─► (1) GroupRole (N)

Chat (1) ──────────► (N) Message
  │
  ├─► (N) ChatUser
  │
  └─► (N) GroupRole

Message (1) ──────────► (N) Reaction
             ──────────► (N) Attachment
             ──────────► (1) Message (Reply)

ModerationLog (N) ──────────► User / Message / Chat
SpamReport (N) ──────────► User / Message
```

---

Документ создан: 14 Августа 2026
Версия: 1.0.0 (MVP)
