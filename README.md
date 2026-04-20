<div align="center">

<img src="https://img.shields.io/badge/Status-Production%20Ready-556B2F?style=for-the-badge&logo=checkmarx&logoColor=white" />
<img src="https://img.shields.io/badge/Architecture-Multi--Tenant%20SaaS-6F4F37?style=for-the-badge&logo=cloudflare&logoColor=white" />
<img src="https://img.shields.io/badge/Backend-Fastify%20%2B%20TypeScript-000000?style=for-the-badge&logo=fastify&logoColor=white" />
<img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Database-MySQL%20Multitenant-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />

<br /><br />

# 🎂 SaaS Confeitaria
### Plataforma SaaS Multi-Tenant para Gestão de Confeitarias

**Da ideia ao produto — construído do zero, do banco de dados à interface, com arquitetura enterprise.**

<br />

> *"Cada pedido é uma história. Conte a sua com a gente."*

<br />

[![Live Demo v2](https://img.shields.io/badge/🚀%20Live%20Demo%20v2-saas--confeitaria--v20.vercel.app-chocolate?style=for-the-badge)](https://saas-confeitaria-v20.vercel.app/login)
[![Live Demo v1](https://img.shields.io/badge/📦%20Demo%20v1-saas--confeitaria.vercel.app-8B4513?style=for-the-badge)](https://saas-confeitaria.vercel.app/login.html)

</div>

---

## 🧠 O que este projeto demonstra sobre mim como dev

Este não é um CRUD tutorial. É uma **plataforma SaaS completa** com isolamento de dados por tenant, autenticação stateless com JWT, controle de permissões por roles e um frontend React com design system próprio — construído e iterado em múltiplas versões.

Se você está recrutando alguém que **pensa em produto, entende de arquitetura e entrega código que vai para produção**, continue lendo.

---

## 🏗️ Arquitetura — De Simples a Enterprise em 3 versões
v1 → Monolito HTML/JS + Express + SQLite   (prova de conceito)
v2 → SPA React + Node.js + MySQL           (product-market fit)
v3 → Multi-Tenant SaaS + TypeScript Full   (arquitetura enterprise)

### Por que Multi-Tenant importa?

Em vez de criar um banco de dados separado por cliente (caro, difícil de manter), implementei **Row-Level Multi-Tenancy** — todas as entidades carregam `tenant_id`, e um middleware intercepta cada requisição para garantir que **nenhum dado de uma confeitaria vaze para outra**.
Requisição HTTP
│
▼
┌─────────────────────┐
│   TenantMiddleware  │  ← Valida X-Tenant-Slug ou X-Tenant-ID
│   (toda requisição) │  ← Injeta tenant no contexto da request
└─────────┬───────────┘
│
▼
┌─────────────────────┐
│   AuthMiddleware    │  ← Valida JWT, extrai userId + tenantId + role
└─────────┬───────────┘
│
▼
┌─────────────────────┐
│   Route Handler     │  ← Toda query filtra por tenant_id automaticamente
└─────────────────────┘

---

## ⚙️ Stack Técnica Completa

### Backend — `Node.js + Fastify + TypeScript`

| Tecnologia | Versão | Motivo da escolha |
|---|---|---|
| **Fastify** | 4.x | 3x mais rápido que Express; schema validation nativo |
| **TypeScript** | 5.x | Type safety em toda a codebase |
| **MySQL2** | 3.x | Pool de conexões com suporte a timezone brasileiro |
| **Zod** | 3.x | Validação de input com inferência de tipos |
| **JWT** | Dual token | Access token (1d) + Refresh token (7d) |
| **bcrypt** | 5.x | Hash de senhas com salt rounds configurável |
| **@fastify/rate-limit** | 9.x | Proteção contra brute force |
| **pino** | Built-in | Logging estruturado em JSON |

### Frontend — `React + Vite + TypeScript`

| Tecnologia | Versão | Motivo da escolha |
|---|---|---|
| **React** | 18.x | Concurrent features + hooks modernos |
| **Vite** | 5.x | HMR instantâneo, build 10-20x mais rápido que CRA |
| **Tailwind CSS** | 3.x | Design system customizado com tokens de cor próprios |
| **React Router** | 6.x | Roteamento declarativo com guards de autenticação |
| **Axios** | 1.x | Interceptors para refresh token automático |
| **Recharts** | 2.x | Gráficos de receita e produtos no dashboard |
| **React Hot Toast** | 2.x | Feedback visual com tema personalizado |
| **Lucide React** | 0.454 | Ícones consistentes e leves |

### Banco de Dados — `MySQL com Schema Multi-Tenant`

```sql
-- Toda tabela tem tenant_id + soft delete + timestamps
tenants      → plano, slug único, status, limites por plano
users        → roles (admin/manager/staff), refresh token, last_login
products     → estoque, preço de custo, categoria
clients      → histórico de compras, total gasto
orders       → status pipeline, entrega, itens relacionados
payments     → método, status, integração Stripe
audit_logs   → rastreamento completo de todas as ações
```

---

## 🔐 Segurança — Camadas implementadas

Rate Limiting          → 100 req/min por IP (anti brute-force)
JWT Dual Token         → Access (1d) + Refresh (7d) com rotação
Tenant Isolation       → Middleware valida tenant em TODA requisição
Row-Level Security     → tenant_id em todas as queries SQL
Role-Based Access      → admin / manager / staff com requireRole()
Soft Delete            → dados nunca são deletados permanentemente
Audit Log              → cada ação registrada com user, IP e timestamp
Password Hashing       → bcrypt com salt rounds
Input Validation       → Zod schema em todos os endpoints
CORS configurado      → whitelist de origens permitidas


---

## 📦 Módulos da Plataforma
📊 Dashboard       → KPIs em tempo real: receita, pedidos, estoque crítico
📋 Pedidos         → Pipeline kanban: pendente → produção → pronto → entregue
🛍️ Produtos        → Catálogo com estoque, preço de custo e margem
👥 Clientes        → CRM leve com histórico e total gasto
💳 Pagamentos      → Registro multi-método (PIX, cartão, dinheiro, Stripe)
📈 Relatórios      → Receita por período, top produtos, ticket médio
🔍 Auditoria       → Log completo de todas as ações do sistema
⚙️ Configurações   → Perfil do tenant, usuários, plano

---

## 🚀 Evolução do Produto — v1 → v3

### v1 — Prova de Conceito
- HTML + CSS + JavaScript vanilla
- Backend Express.js + SQLite
- Autenticação simples com sessão
- Deploy estático no Vercel
- **Objetivo:** validar se a ideia funcionava

### v2 — Produto Real
- Migração para React + Vite
- MySQL em produção
- Design system com Tailwind
- Dashboard com gráficos reais
- **Objetivo:** produto utilizável em produção

### v3 — Arquitetura Enterprise *(versão atual)*
- **Multi-Tenant completo** com isolamento por `tenant_id`
- TypeScript em todo o projeto (frontend + backend)
- Fastify substituindo Express (performance 3x superior)
- Sistema de roles e permissões granular
- Refresh token com rotação automática
- Middleware de auditoria em todas as ações
- Rate limiting e proteções de segurança
- Schema de banco com 9 tabelas relacionadas
- **Objetivo:** plataforma SaaS escalável para múltiplos clientes

---

## 📐 Estrutura do Projeto
saas-confeitaria/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── app.ts              # Bootstrap do Fastify, plugins, rotas
│   │   │   └── server.ts           # Entry point
│   │   ├── modules/                # Feature-based architecture
│   │   │   ├── auth/               # login, register, refresh, logout
│   │   │   ├── tenants/            # onboard, profile, planos
│   │   │   ├── users/              # CRUD de usuários por tenant
│   │   │   ├── products/           # Catálogo + estoque
│   │   │   ├── clients/            # CRM
│   │   │   ├── orders/             # Pipeline de pedidos
│   │   │   ├── payments/           # Pagamentos + Stripe
│   │   │   ├── dashboard/          # Aggregations e KPIs
│   │   │   ├── audit/              # Logs de auditoria
│   │   │   └── health/             # Health check
│   │   ├── middlewares/
│   │   │   ├── tenant.middleware.ts # Isolamento multi-tenant
│   │   │   └── auth.middleware.ts   # JWT + role extraction
│   │   ├── database/
│   │   │   ├── connection.ts        # Pool MySQL
│   │   │   ├── migrations/          # Schema versionado
│   │   │   └── seed.ts              # Dados demo
│   │   └── shared/
│   │       ├── errors/             # AppError, handlers globais
│   │       └── utils/              # jwt, hash, validators
│   └── package.json
│
└── frontend/
├── src/
│   ├── pages/                  # Dashboard, Orders, Products...
│   ├── components/
│   │   ├── ui/                 # Design system próprio
│   │   └── layout/             # Layout com sidebar responsivo
│   ├── context/
│   │   └── AuthContext.tsx     # Estado global de autenticação
│   ├── services/
│   │   └── api.ts              # Axios + interceptors JWT
│   └── types/                  # Interfaces TypeScript
└── package.json

---

## 🏃 Setup em 5 minutos

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/saas-confeitaria.git

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure o ambiente

```bash
cd backend
cp .env.example .env
```

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=sua_senha
DB_NAME=saas_confeitaria
JWT_SECRET=string_longa_e_segura_minimo_32_chars
FRONTEND_URL=http://localhost:5173
```

### 3. Banco de dados

```sql
CREATE DATABASE saas_confeitaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
cd backend && npm run migrate
```

### 4. Rode

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
# Acesse: http://localhost:5173
```

### 5. Primeiro acesso

/onboard  → cadastre sua confeitaria
Guarde o slug gerado
/login    → slug + email + senha


---

## 🗺️ Roadmap

- [ ] Notificações em tempo real via WebSocket
- [ ] App mobile com React Native
- [ ] Integração WhatsApp para confirmação de pedidos
- [ ] Módulo de produção com kanban por confeiteiro
- [ ] Relatórios em PDF exportáveis
- [ ] White-label por tenant no plano Enterprise

---

## 💼 Para Recrutadores

Se você chegou até aqui, sabe que este projeto vai além do "fiz um CRUD com React".

✅ **Arquitetura de software** — escolhi Multi-Tenant Row-Level por custo operacional. Documentei o tradeoff vs schema-per-tenant.

✅ **Segurança real** — JWT com refresh rotation, rate limiting, audit log, roles. Não só "coloquei um token e chamei de seguro".

✅ **Evolução iterativa** — v1 → v2 → v3 mostra que sei validar antes de construir, e refatorar quando a arquitetura pede.

✅ **TypeScript full-stack** — não `any` em tudo. Tipos nos módulos, middlewares e respostas de API.

✅ **Debug e resolução de problemas** — identifiquei incompatibilidades no ecossistema Fastify (`@fastify/rate-limit@10` exige v5, projeto usa v4), lógica errada no middleware de tenant, e fallback hardcoded que quebrava todo o fluxo.

✅ **Produto, não só código** — pensei em onboarding, UX da tela de login, mensagens de erro úteis para o usuário final.

---

## 📬 Contato

<div align="center">

Construído com ☕ e muito açúcar por **[Seu Nome]**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Conectar-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/seu-perfil)
[![GitHub](https://img.shields.io/badge/GitHub-Seguir-181717?style=for-the-badge&logo=github)](https://github.com/seu-usuario)
[![Email](https://img.shields.io/badge/Email-Conversar-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:seu@email.com)

</div>

---

<div align="center">

📝 Licença MIT — use, fork, aprenda, melhore.

*Se este projeto te impressionou, imagina o que posso construir na sua empresa.*

</div>
