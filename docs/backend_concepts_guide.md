# SupportPilot Backend Concepts Guide 🎓
> A comprehensive, beginner-friendly handbook explaining every major backend concept, architecture pattern, and design decision used in SupportPilot — and **why** it was chosen.

---

## Table of Contents
1. [The Big Picture: How Client and Server Talk](#1-the-big-picture-how-client-and-server-talk)
2. [Controllers: The Front Door of the API](#2-controllers-the-front-door-of-the-api)
3. [Entities vs. DTOs: Why We Separate Them](#3-entities-vs-dtos-why-we-separate-them)
4. [ORM & EF Core: Talking to the Database Without SQL](#4-orm--ef-core-talking-to-the-database-without-sql)
5. [PostgreSQL & pgvector: Relational Data + AI Search](#5-postgresql--pgvector-relational-data--ai-search)
6. [Dependency Injection (DI): The Lego Block Architecture](#6-dependency-injection-di-the-lego-block-architecture)
7. [Authentication with JWT: Stateless Security](#7-authentication-with-jwt-stateless-security)
8. [Password Hashing: Why Plain Text is Forbidden](#8-password-hashing-why-plain-text-is-forbidden)
9. [SignalR & WebSockets: Real-Time Two-Way Communication](#9-signalr--websockets-real-time-two-way-communication)
10. [AI Embeddings & Grounded RAG: Preventing Hallucinations](#10-ai-embeddings--grounded-rag-preventing-hallucinations)
11. [Middleware Pipeline: The Request Conveyor Belt](#11-middleware-pipeline-the-request-conveyor-belt)
12. [In-Memory Testing with WebApplicationFactory](#12-in-memory-testing-with-webapplicationfactory)
13. [Glossary of Common Backend Terms](#13-glossary-of-common-backend-terms)
14. [Junior vs. Mid-Level vs. Senior Backend Engineer: What to Know & Skill Matrix](#14-junior-vs-mid-level-vs-senior-backend-engineer-what-to-know--skill-matrix)

---

## 1. The Big Picture: How Client and Server Talk

When a user clicks **"Submit Ticket"** in the React application, here is the journey of that request:

```
[ Browser / React App ]
         │
         │ 1. HTTP POST /api/tickets (JSON body + JWT Token)
         ▼
[ ASP.NET Core Middleware Pipeline ]
         │ (Rate limiting check -> CORS check -> Auth check: Is token valid?)
         ▼
[ TicketsController ]
         │ (Validates input data, extracts current user ID)
         ▼
[ Business Services (SlaPolicy, etc.) ]
         │ (Calculates SLA target dates based on priority)
         ▼
[ EF Core AppDbContext ]
         │ (Translates C# objects into SQL INSERT statements)
         ▼
[ PostgreSQL Database ]
         │ (Saves record to disk, generates unique ID)
         ▲
         │ 2. Returns saved record
[ TicketsController ]
         │ (Maps Entity to TicketDetailDto)
         ▼
[ Browser / React App ]
           3. Receives HTTP 201 Created (JSON ticket data)
```

### Why ASP.NET Core 8?
- **Speed**: ASP.NET Core is consistently ranked among the fastest web frameworks in TechEmpower benchmarks.
- **Type Safety**: C# catches type bugs at compile time before code ever runs in production.
- **Built-in Features**: Dependency injection, authentication, WebSockets, rate limiting, and health checks are all built into the framework standard library.

---

## 2. Controllers: The Front Door of the API

A **Controller** is a C# class responsible for listening to incoming HTTP requests, deciding what to do with them, and returning an HTTP response.

**Located in**: `backend/SupportPilot.Api/Controllers/`

### Example from [TicketsController.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Controllers/TicketsController.cs):
```csharp
[ApiController]
[Route("api/[controller]")] // URL will be: /api/tickets
public class TicketsController : ControllerBase
{
    [HttpGet] // Handles GET /api/tickets
    public async Task<ActionResult<List<TicketDto>>> GetTickets() { ... }

    [HttpPost] // Handles POST /api/tickets
    public async Task<ActionResult<TicketDetailDto>> CreateTicket([FromBody] CreateTicketRequest request) { ... }

    [HttpPatch("{id:guid}/status")] // Handles PATCH /api/tickets/{id}/status
    public async Task<ActionResult<TicketDto>> UpdateStatus(Guid id, [FromBody] UpdateTicketStatusRequest request) { ... }
}
```

### HTTP Verbs Used & Why:
- **`GET`**: Retrieve data without changing anything (e.g. `GET /api/tickets`).
- **`POST`**: Create a brand new resource (e.g. `POST /api/tickets`, `POST /api/auth/login`).
- **`PATCH`**: Modify a specific part of an existing resource (e.g. changing just the `status` or `priority`).
- **`DELETE`**: Remove a resource.

---

## 3. Entities vs. DTOs: Why We Separate Them

In beginner tutorials, people often return their database tables directly to the frontend. In production, this causes security vulnerabilities and brittle code.

SupportPilot separates **Entities** from **DTOs**:

| Concept | What It Is | Location |
| :--- | :--- | :--- |
| **Entity** (`Models.cs`) | The exact structure of the table in PostgreSQL. Contains internal fields like `PasswordHash`, database foreign keys, and private flags. | [Models.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Entities/Models.cs) |
| **DTO** (`Dtos.cs`) | **Data Transfer Object**: The contract for what is sent across the network. Only exposes what the frontend needs to see. | [Dtos.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/DTOs/Dtos.cs) |

### Why DTOs are Crucial:
1. **Security**: Without DTOs, returning a `User` entity would accidentally send the `PasswordHash` over the network!
2. **Performance**: You only send the columns the frontend needs, saving bandwidth.
3. **Decoupling**: If you rename a database column tomorrow, you don't break the frontend app because the DTO format remains stable.

---

## 4. ORM & EF Core: Talking to the Database Without SQL

**ORM** stands for *Object-Relational Mapping*. **Entity Framework Core (EF Core)** is Microsoft's official ORM for .NET.

### Without an ORM (Raw SQL):
```csharp
// Error-prone, no compile-time checking, vulnerable to SQL injection
var command = new NpgsqlCommand("SELECT * FROM Tickets WHERE Priority = '" + priority + "'", connection);
var reader = command.ExecuteReader();
```

### With EF Core:
```csharp
// 100% type-safe, automatically parameterized to prevent SQL injection:
var tickets = await _dbContext.Tickets
    .Where(t => t.Priority == TicketPriority.Urgent)
    .Include(t => t.Customer) // Automatically joins the Customers table!
    .ToListAsync();
```

### What is `AppDbContext`?
[AppDbContext.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Data/AppDbContext.cs) is your application's session with PostgreSQL. Each `DbSet<T>` represents a table:
```csharp
public DbSet<User> Users => Set<User>();
public DbSet<Ticket> Tickets => Set<Ticket>();
public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();
public DbSet<CsatSurvey> CsatSurveys => Set<CsatSurvey>();
```

---

## 5. PostgreSQL & pgvector: Relational Data + AI Search

SupportPilot uses **PostgreSQL 16** with the **`pgvector`** extension running inside Docker.

### Why Relational?
Customer support requires strict relationships:
- One `Organization` has many `Users`.
- One `Customer` creates many `Tickets`.
- One `Ticket` has an ordered trail of `TicketMessages`.
- A ticket can have at most one `CsatSurvey`.
Relational databases enforce **referential integrity** (you cannot have an orphaned message for a ticket that doesn't exist).

### Why `pgvector`?
Standard databases can only search for exact words (e.g. `LIKE '%refund%'`).
With AI, users ask questions with synonyms: *"How can I get my money back?"*
- SupportPilot converts documents and questions into **dense vectors** (arrays of 128 numbers like `[0.12, -0.45, 0.88, ...]`).
- `pgvector` computes the mathematical angle (**cosine similarity**) between the question vector and document vectors inside PostgreSQL to find the most conceptually relevant article instantly.

---

## 6. Dependency Injection (DI): The Lego Block Architecture

In [Program.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Program.cs), you will see lines like:
```csharp
builder.Services.AddScoped<IGroundedRagService, GroundedRagService>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IPresenceTracker, PresenceTracker>();
```

### What is Dependency Injection?
Instead of a class creating its own helpers (`new PasswordHasher()`), the framework **injects** them through the constructor:
```csharp
public class AuthController : ControllerBase
{
    private readonly IPasswordHasher _hasher;

    // The framework passes the hasher automatically!
    public AuthController(IPasswordHasher hasher)
    {
        _hasher = hasher;
    }
}
```

### The 3 Lifetimes in .NET:
1. **`Transient`**: Created fresh every time it is requested.
2. **`Scoped`**: One instance created per HTTP request and shared across everything handling that request (e.g. `AppDbContext`, `GroundedRagService`).
3. **`Singleton`**: Created once when the server starts and shared across every user and every request forever (e.g. `PresenceTracker` for live chat users, `PasswordHasher`).

---

## 7. Authentication with JWT: Stateless Security

SupportPilot uses **JSON Web Tokens (JWT)** for authentication.

### How It Works:
```
1. Customer sends credentials:
   POST /api/auth/login { "email": "sarah@cyberdyne.io", "password": "Password123!" }

2. Server verifies password. If correct, generates a cryptographic JWT string:
   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

3. Browser saves token in localStorage.

4. On every future request, browser sends header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

5. Server decodes and verifies the signature using the secret key (Jwt:Key).
   The server immediately knows:
   - User ID: 11111111-...
   - Email: sarah@cyberdyne.io
   - Role: Customer
   - Organization: Acme Corp
```

### Why JWT over Traditional Cookies/Sessions?
- **Stateless**: The server does not store active sessions in RAM. If you scale to 10 server containers, any container can verify any user's token instantly without sharing a session store.

---

## 8. Password Hashing: Why Plain Text is Forbidden

Passwords are **never** stored in readable text in the database. If a database is ever leaked, raw passwords must not be exposed.

**Located in**: [PasswordHasher.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Services/PasswordHasher.cs)

### How We Hash:
1. When a user creates a password (`"Password123!"`), we generate a random 16-byte cryptographic **Salt**.
2. We run **PBKDF2** (Password-Based Key Derivation Function 2) with 100,000 iterations using HMAC-SHA256.
3. The result is a 256-bit irreversible hash.
4. When logging in, the server hashes the incoming password with the stored salt; if the output hashes match, access is granted.

---

## 9. SignalR & WebSockets: Real-Time Two-Way Communication

Traditional HTTP is a **one-way request-response** protocol: the browser asks, the server answers, the connection closes. The server cannot talk to the browser on its own.

### The Problem in Customer Support:
If an agent replies to a ticket or types a message, the customer wouldn't see it unless they manually refreshed the page!

### The Solution: SignalR WebSockets
[SupportChatHub.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Hubs/SupportChatHub.cs) establishes a persistent, persistent two-way TCP pipe:
- **Instant Messaging**: When an agent clicks send, the server pushes the message directly to the customer's browser in under 10 milliseconds.
- **Typing Indicators**: As someone types in the input box, `SendTyping(ticketId, isTyping)` broadcasts to the other party.
- **Presence Tracking**: [PresenceTracker.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Services/PresenceTracker.cs) keeps a concurrent set of online user connections.

---

## 10. AI Embeddings & Grounded RAG: Preventing Hallucinations

**RAG** stands for **Retrieval-Augmented Generation**.

### The Problem with Generic AI:
If you ask an AI model a question about your private company, it will often "hallucinate" (invent believable but completely fake answers).

### SupportPilot's 4-Step Grounded RAG Pipeline:
```
1. Ingestion:
   Every article in the Knowledge Base is converted into dense vector embeddings.

2. Query Matching:
   When a user asks: "What is your refund policy?"
   The server generates an embedding for that question and compares it with articles using Cosine Similarity.

3. Confidence Gate (Threshold: 55%):
   - If highest matching score >= 0.55: The server extracts the exact verified paragraphs.
   - If highest matching score < 0.55: The AI REFUSES to guess. It automatically marks the question as ungrounded and routes it to a human support agent!

4. Grounded Synthesis:
   The AI drafts the response using ONLY the verified documentation, including citations:
   "Based on [Refund and Billing Policy]: You have 14 days to request a refund."
```

---

## 11. Middleware Pipeline: The Request Conveyor Belt

In [Program.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/backend/SupportPilot.Api/Program.cs), requests pass through a chain of **Middleware** like items on a conveyor belt before reaching your controller:

```
Request In
   │
   ├── 1. Security Headers: Injects X-Frame-Options: DENY, X-Content-Type-Options: nosniff
   │
   ├── 2. HSTS: Enforces HTTPS in production
   │
   ├── 3. CORS: Allows requests only from approved frontend URLs (http://localhost:5173, etc.)
   │
   ├── 4. Rate Limiter: Rejects clients making > 120 requests/minute with HTTP 429 Too Many Requests
   │
   ├── 5. Authentication: Extracts and validates the JWT Bearer token
   │
   ├── 6. Authorization: Verifies if user has permission (Customer vs SupportAgent vs Admin)
   │
   ▼
Controller Action Executes
   ▲
   │
Response Out
```

---

## 12. In-Memory Testing with WebApplicationFactory

In [CustomWebApplicationFactory.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/tests/SupportPilot.IntegrationTests/CustomWebApplicationFactory.cs), we test our entire API without running a separate server process.

### How It Works:
1. `WebApplicationFactory<Program>` boots the full ASP.NET Core API in memory inside the test process.
2. It replaces PostgreSQL with EF Core's **In-Memory database provider**.
3. It seeds testing accounts and tickets.
4. The test class [AuthAndTicketsIntegrationTests.cs](file:///Users/kaleabmezgebe/Desktop/personal%20projects/SupportPilot/tests/SupportPilot.IntegrationTests/AuthAndTicketsIntegrationTests.cs) acts like a browser: it sends real HTTP requests (`_client.PostAsJsonAsync("/api/auth/login", ...)`) and verifies the status codes, headers, and JSON payloads.

---

## 13. Glossary of Common Backend Terms

| Term | Definition |
| :--- | :--- |
| **API** | Application Programming Interface — a set of rules allowing the frontend to communicate with the backend. |
| **REST** | Representational State Transfer — architectural style using standard HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`) and URLs. |
| **DTO** | Data Transfer Object — an object tailored specifically for transferring data across the network. |
| **ORM** | Object-Relational Mapper — translates C# classes into database tables and queries. |
| **Migration** | A version-controlled C# script that updates the database schema when you add or change models. |
| **JWT** | JSON Web Token — a compact, URL-safe means of representing claims to be transferred between two parties. |
| **Payload** | The actual body data sent within an HTTP request or response (usually JSON). |
| **CORS** | Cross-Origin Resource Sharing — browser security feature preventing unauthorized websites from reading your API. |
| **Rate Limiting** | Restricting the number of requests a single IP or user can make in a given timeframe to prevent abuse. |
| **SLA** | Service Level Agreement — the target timeframe within which a ticket must be answered or resolved. |
| **CSAT** | Customer Satisfaction Score — numerical rating (1–5 stars) submitted by customers after ticket resolution. |
| **RAG** | Retrieval-Augmented Generation — grounding AI model outputs in retrieved private documents to prevent hallucinations. |
| **WebSocket** | Full-duplex, persistent communication channel over a single TCP connection. |

---

## 14. Junior vs. Mid-Level vs. Senior Backend Engineer: What to Know & Skill Matrix

The difference between Junior, Mid-Level, and Senior developers is not just years of experience — it is the **scope of thinking**, **trade-off analysis**, and **ability to anticipate failure before it happens in production**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ SENIOR: "Why this architecture? What fails at 100x scale? What trade-  │
│          offs exist between consistency, latency, and operational cost?│
├────────────────────────────────────────────────────────────────────────┤
│ MID-LEVEL: "How do I build this cleanly, safely, and testably without  │
│             introducing bugs, tech debt, or performance regressions?"  │
├────────────────────────────────────────────────────────────────────────┤
│ JUNIOR: "How do I make this feature work and return the right data     │
│          according to the specification?"                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Comparison Matrix

| Area | 🟢 Junior Backend Developer | 🟡 Mid-Level Backend Developer | 🔴 Senior Backend Developer |
| :--- | :--- | :--- | :--- |
| **Focus** | Feature execution & bug fixes | Clean architecture & autonomy | System design, trade-offs & resilience |
| **API Design** | Basic CRUD (`GET`, `POST`, `PUT`, `DELETE`) | RESTful conventions, DTO mapping, standard error responses (`ProblemDetails`) | API versioning strategies, backward compatibility, idempotency keys, rate-limiting tiers, hypermedia/gRPC |
| **Databases** | Writing simple queries, basic migrations | Indexing strategies (B-Tree), avoiding N+1 queries, transaction rollback | Concurrency control (optimistic vs. pessimistic locking), isolation levels, partitioning/sharding, connection pooling, replication lag |
| **Testing** | Simple unit tests for "happy path" | Comprehensive unit & integration tests, edge cases, mocking dependencies | Test strategy (pyramid vs. trophy), load/stress testing, contract testing, chaos testing |
| **Architecture** | Follows existing patterns in codebase | SOLID principles, clean separation of concerns, Dependency Injection | Distributed systems (CAP/PACELC), event-driven architectures, microservices vs. modular monolith, CQRS |
| **Error Handling** | `try / catch` blocks with `Console.WriteLine` | Global exception middleware, structured error codes, logging with context | Circuit breakers, retry with exponential backoff & jitter, bulkhead isolation, graceful degradation |
| **Security** | Basic password hashing & JWT usage | Role-based authorization (RBAC), SQL injection & XSS prevention, CORS | Threat modeling (STRIDE), Zero-Trust architecture, cryptographic key rotation, data masking, multi-tenant isolation |
| **Observability** | Reading console logs | Structured JSON logging (Serilog), health checks | Distributed tracing (OpenTelemetry), RED metrics (Rate, Error, Duration), profiling CPU/memory leaks, SLOs/SLIs |
| **Leadership** | Learns from PR reviews | Conducts thorough PR reviews, helps juniors | Writes RFCs / ADRs, drives architectural decisions, mentors teams, aligns tech with business ROI |

---

### What a Senior Backend Developer Must Master

#### 1. System Design & Architectural Trade-offs
- **Monolith vs. Microservices vs. Modular Monolith**: Knowing when microservices add unnecessary network latency and operational overhead, and when modular monoliths are superior.
- **CAP Theorem & PACELC Theorem**: In a distributed system with network partitions, deciding between **Consistency** (CP) and **Availability** (AP). Understanding latency vs. consistency trade-offs even under normal operation.
- **Event-Driven Architecture**: Decoupling components using message brokers (RabbitMQ, Apache Kafka). Understanding delivery guarantees: *At-most-once*, *At-least-once*, and the reality of *Exactly-once* processing.
- **CQRS (Command Query Responsibility Segregation)**: Separating read models (optimized for fast queries, e.g. Elasticsearch/Read Replicas) from write models (optimized for consistency).

#### 2. Advanced Database Engineering at Scale
- **Transaction Isolation Levels**:
  - `Read Uncommitted` (dirty reads)
  - `Read Committed` (prevents dirty reads — default in PostgreSQL)
  - `Repeatable Read` (prevents non-repeatable reads)
  - `Serializable` (full ACID serializability, highest overhead)
- **Concurrency & Locking**:
  - **Optimistic Concurrency**: Using version columns (`xmin` or `RowVersion`) — fails fast if another user modified the row first.
  - **Pessimistic Concurrency**: `SELECT ... FOR UPDATE` — locks the row until transaction commit.
- **Scaling Strategies**:
  - Read replicas (master-replica topology) and handling **replication lag** (avoiding reading stale data right after writing).
  - Sharding & Table Partitioning (range, hash, list partitioning) for tables with tens of millions of rows.
  - Connection pooling management (e.g. PgBouncer) to prevent database thread exhaustion.
  - Vector indexing internals (HNSW vs. IVFFlat in pgvector: recall accuracy vs. build time vs. memory footprint).

#### 3. Resilience & Distributed Systems Patterns
- **Idempotency Keys**: Guaranteeing that retried requests (e.g., Stripe billing, ticket submission) will never create duplicate resources even if network timeouts occur.
- **Circuit Breaker Pattern**: Automatically stopping outbound calls to a failing downstream service (e.g., an external LLM API) so the main application thread pool is not starved.
- **Transactional Outbox Pattern**: Storing events in a local database table within the same ACID transaction as the business entity, then asynchronously publishing to Kafka/RabbitMQ to prevent lost messages.
- **Graceful Degradation**: If an AI embedding service or external webhook goes down, fallback to local dense embeddings or asynchronous queueing rather than crashing the user request.

#### 4. Caching Strategies & Pitfalls
- **Patterns**: Cache-Aside (Lazy Loading), Write-Through, Write-Behind.
- **Cache Invalidation**: *"There are only two hard things in Computer Science: cache invalidation and naming things."*
- **Common Failure Modes**:
  - **Cache Stampede (Thundering Herd)**: Millions of requests hitting the database simultaneously when a popular cache key expires. Mitigated by mutex locks or early probabilistic expiration (XFetch).
  - **Cache Penetration**: Malicious queries requesting keys that never exist in the database, bypassing the cache. Mitigated by Bloom Filters or caching nulls.
  - **Cache Avalanche**: Many keys expiring at the exact same second. Mitigated by adding random jitter to TTLs.

#### 5. Observability & Site Reliability (SRE Mindset)
- **The Three Pillars**:
  1. **Metrics**: The RED method (Rate, Errors, Duration) and USE method (Utilization, Saturation, Errors).
  2. **Distributed Tracing**: Propagating `TraceId` and `SpanId` headers (W3C standard) through every microservice and database query.
  3. **Structured Logs**: Queryable JSON logs indexed in systems like Grafana Loki or ELK.
- **Profiling & Performance**: Identifying memory leaks, CPU spikes, garbage collection pauses, and async deadlock hazards (`.Result` / `.Wait()`).

#### 6. Technical Leadership, Communication & Governance
- **Architecture Decision Records (ADRs)**: Documenting *why* a particular database, framework, or design was chosen, along with considered alternatives and accepted trade-offs.
- **Pragmatism Over Hype**: Choosing boring, proven technologies when appropriate, rather than adopting new frameworks just because they are trending.
- **Business Alignment**: Translating engineering debt into financial impact (cloud hosting costs, developer velocity, churn risk).

