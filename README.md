# SupportPilot — AI-Powered Customer Service Platform

> Combining AI-powered self-service, structured ticket management, real-time communication, and human agent workflows in one modern SaaS platform.

---

## 🚀 Repository Structure

```
SupportPilot/
├── frontend/                     # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/           # Header, Sidebar, Shared UI
│   │   ├── features/             # Feature-specific modules
│   │   │   ├── auth/             # Identity & permissions
│   │   │   ├── tickets/          # Ticket queues & thread detail
│   │   │   ├── chat/             # SignalR live chat
│   │   │   ├── knowledge-base/   # AI knowledge search
│   │   │   └── analytics/        # SLA & CSAT dashboards
│   │   ├── layouts/              # App container layout
│   │   ├── pages/                # Dashboard, Tickets, KB, Live Hub, Analytics
│   │   ├── services/             # API client & backend health check
│   │   └── types/                # Domain type contracts
│   ├── Dockerfile
│   └── package.json
├── backend/
│   └── SupportPilot.Api/         # ASP.NET Core 8 Web API
│       ├── Controllers/          # Health, Tickets, Dashboard, KB
│       ├── Data/                 # AppDbContext & PostgreSQL mappings
│       ├── Entities/             # User, Ticket, Message, Category, Article, AuditLog
│       ├── DTOs/                 # Request/Response contracts
│       ├── Services/             # Domain service layer
│       ├── Authorization/        # RBAC policies
│       ├── Hubs/                 # SignalR live messaging
│       ├── Dockerfile
│       └── Program.cs
├── tests/
│   ├── SupportPilot.UnitTests/   # xUnit unit tests
│   └── SupportPilot.IntegrationTests/ # Integration tests
├── docs/                         # Architecture, Roadmap, API specs
├── docker-compose.yml            # Multi-container local stack (PostgreSQL + API + UI)
├── SupportPilot.sln              # Root .NET Solution
└── README.md
```

---

## 🛠️ Quick Start

### 1. Run the Backend API (.NET 8)

```bash
cd backend/SupportPilot.Api
dotnet run
```
- API Swagger UI: `http://localhost:5000/swagger`
- Health Endpoint: `http://localhost:5000/api/health`

### 2. Run the Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

### 3. Run with Docker Compose

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

### 4. Run Test Suite

```bash
dotnet test
```

---

## 📋 Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Glassmorphic CSS Design System
- **Backend**: ASP.NET Core 8 Web API, Entity Framework Core, SignalR, Swagger/OpenAPI
- **Database**: PostgreSQL 16 with pgvector for AI embeddings
- **Containerization**: Docker & Docker Compose
- **Testing**: xUnit, FluentAssertions

---

## 🎯 Product Delivery Plan

- **Sprint 1 (Foundation)**: ✅ Solution architecture, React workspace, ASP.NET Core API, CORS & Health probes.
- **Sprint 2 (Identity & Auth)**: ✅ JWT token authentication, customer vs agent roles, protected route guards, PBKDF2 hashing.
- **Sprint 3–4 (Ticketing MVP)**: ✅ Customer submission, queue assignment, message threads, internal notes, status transitions.
- **Sprint 5 (Support Workspace)**: ✅ Filtering, sorting, bulk triage panels, SLA timers & countdown indicators.
- **Sprint 6 (Knowledge Base & AI)**: ✅ Grounded article search, vector embeddings, generative AI answers, fallback escalation.
- **Sprint 7 (Real-time Hub)**: ✅ SignalR live chat, real-time notifications, agent presence, typing indicators.
- **Sprint 8 (Hardening & Launch)**: ✅ Performance tuning, automated CI/CD, Docker deployment, integration tests, backup & recovery runbooks.
- **Sprint 9 (Enterprise Extensions)**: ✅ Multi-LLM provider dispatch (OpenAI, Gemini & local fallback), inbound email ingestion via webhooks, Slack Block Kit alerts, and interactive CSAT ratings.
