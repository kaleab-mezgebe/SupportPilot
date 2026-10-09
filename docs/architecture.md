# SupportPilot Architecture Specification

## Overview

SupportPilot is designed as a modular monolith SaaS platform utilizing modern cloud-native standards.

```
┌─────────────────────────────────────────────────────────────┐
│                       React + TypeScript UI                 │
│       Customer Portal · Agent Workspace · Admin Panel       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / SignalR
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 ASP.NET Core 8+ Web API Engine              │
│  Controllers · Authentication · Services · SignalR Hubs     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      PostgreSQL Database     │ │  AI Knowledge Provider     │
│   Persistent Data & Vectors  │ │  RAG & Grounded Retrieval  │
└──────────────────────────────┘ └────────────────────────────┘
```

## Backend Modular Structure (`SupportPilot.Api`)

- **`Controllers/`**: HTTP request handlers (Health, Tickets, Dashboard, KnowledgeBase, Auth).
- **`Data/`**: Entity Framework Core DbContext (`AppDbContext`) and database migrations.
- **`Entities/`**: Core Domain models (`User`, `Organization`, `Ticket`, `TicketMessage`, `TicketCategory`, `KnowledgeArticle`, `AuditLog`).
- **`DTOs/`**: Request and Response transfer contracts.
- **`Services/`**: Business logic, ticket routing, SLA evaluation, AI embeddings & retrieval.
- **`Authorization/`**: Role-based access policies and permission filters.
- **`Hubs/`**: SignalR real-time messaging hubs for agent/customer live chat.

## Data Model & Relationships

- **User**: Identified by UUID and Email. Role (`Customer`, `SupportAgent`, `SupportManager`, `SystemAdministrator`).
- **Organization**: Multitenant container for tickets, members, and custom settings.
- **Ticket**: Contains reference code (`SP-XXXX`), status, priority, customer FK, agent FK.
- **TicketMessage**: Thread replies supporting agent, customer, internal notes, and AI co-pilot tags.
- **KnowledgeArticle**: Approved company documentation used to ground AI responses.
- **AuditLog**: Immutable action history for security and compliance tracking.
