# BookLeaf Author Support & Communication Portal

A full-stack web application for BookLeaf Publishing that streamlines author support operations through AI-powered ticket management.

---

## Live Demo

> **Deploy to Vercel/Render and add the live URL here.**

**Test Credentials:**

| Role   | Email                        | Password      |
|--------|------------------------------|---------------|
| Admin  | admin@bookleaf.com           | adminpass123  |
| Author | priya.sharma@email.com       | password123   |
| Author | rohit.kapoor@email.com       | password123   |
| Author | sneha.kulkarni@email.com     | password123   |
| Author | diya.chatterjee@email.com    | password123   |

> All 10 sample authors use the password: `password123`

---

## Tech Stack

| Layer     | Technology          | Reason                                                          |
|-----------|---------------------|-----------------------------------------------------------------|
| Framework | Next.js 14 (App Router) | Monorepo — frontend + API in one codebase, easy Vercel deploy |
| Language  | TypeScript          | Type safety across the stack                                    |
| Database  | SQLite + Prisma     | Zero-config for local dev; swap to PostgreSQL for production   |
| Auth      | JWT + httpOnly cookies | Secure, stateless, no external service needed                |
| AI/LLM    | OpenAI gpt-4o-mini  | Fast, inexpensive, reliable for classification + drafts        |
| Realtime  | Server-Sent Events  | Simpler than WebSockets for one-way (server→client) updates   |
| Styling   | Tailwind CSS v4     | Utility-first, design tokens, no runtime overhead              |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # login, logout, me
│   │   ├── author/         # author-specific endpoints
│   │   ├── tickets/        # CRUD + respond + notes + ai-draft
│   │   ├── admin/          # stats, authors
│   │   └── sse/            # Server-Sent Events endpoint
│   ├── author/             # Author portal pages
│   │   ├── dashboard/
│   │   ├── books/
│   │   └── tickets/
│   ├── admin/              # Admin portal pages
│   │   ├── dashboard/
│   │   ├── tickets/
│   │   └── authors/
│   └── login/
├── components/
│   ├── layout/             # AuthorSidebar, AdminSidebar
│   └── ui/                 # Badge, Spinner, EmptyState, Toast
├── contexts/               # AuthContext (global auth state)
├── hooks/                  # useSSE (real-time event hook)
└── lib/
    ├── prisma.ts            # Prisma client singleton
    ├── auth.ts              # JWT + bcrypt helpers
    ├── api-middleware.ts    # requireAuth, requireAdmin
    ├── openai.ts            # AI classification + draft generation
    └── sse-store.ts         # In-process SSE event emitter
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### Steps

```bash
# 1. Clone the repo
cd bookleaf-portal

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed with sample data
npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"          # Change in production
OPENAI_API_KEY="sk-..."               # Required for AI features
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## API Documentation

All endpoints are prefixed with `/api`. Authentication is via `bl_token` httpOnly cookie or `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint          | Description              | Auth Required |
|--------|-------------------|--------------------------|---------------|
| POST   | `/api/auth/login` | Login with email+password | No           |
| POST   | `/api/auth/logout`| Clear auth cookie         | No           |
| GET    | `/api/auth/me`    | Get current user info     | Yes          |

**POST /api/auth/login**
```json
{ "email": "priya.sharma@email.com", "password": "password123" }
```

### Author Endpoints (role: author)

| Method | Endpoint           | Description             |
|--------|--------------------|-------------------------|
| GET    | `/api/author/books` | Get author's own books |

### Ticket Endpoints

| Method | Endpoint                          | Description                           | Role       |
|--------|-----------------------------------|---------------------------------------|------------|
| GET    | `/api/tickets`                    | List tickets (author: own; admin: all)| Both       |
| POST   | `/api/tickets`                    | Create new ticket                     | Author     |
| GET    | `/api/tickets/:id`                | Get ticket detail                     | Both       |
| PATCH  | `/api/tickets/:id`                | Update status/category/priority       | Admin      |
| POST   | `/api/tickets/:id/respond`        | Send response to author               | Admin      |
| GET    | `/api/tickets/:id/notes`          | Get internal notes                    | Admin      |
| POST   | `/api/tickets/:id/notes`          | Add internal note                     | Admin      |
| GET    | `/api/tickets/:id/ai-draft`       | Get/generate AI draft response        | Admin      |

**Query params for GET /api/tickets:**
- `status`: Open | In Progress | Resolved | Closed
- `category`: ticket category string
- `priority`: Critical | High | Medium | Low
- `page`: page number (default: 1)
- `limit`: results per page (default: 20)

### Admin Endpoints (role: admin)

| Method | Endpoint            | Description                   |
|--------|---------------------|-------------------------------|
| GET    | `/api/admin/stats`  | Dashboard stats summary       |
| GET    | `/api/admin/authors`| All authors with books        |

### Real-Time

| Method | Endpoint    | Description                                     |
|--------|-------------|-------------------------------------------------|
| GET    | `/api/sse`  | SSE stream for author's real-time ticket updates|

---

## AI Integration

### Model
**OpenAI gpt-4o-mini** — chosen for its strong reasoning-to-cost ratio. At ~$0.15/1M input tokens it makes AI features practical at scale without GPT-4o pricing.

### How It Works

**1. Auto-Classification + Priority (1 combined API call per ticket)**

When a ticket is created, a background async call classifies it into one of 6 categories and assigns a priority (Critical/High/Medium/Low) in a single request. The response is JSON-structured with low temperature (0.1) for deterministic output. If the AI call fails, the ticket is still created with null category/priority — admins can set these manually.

**2. AI-Drafted Response (1 API call, cached)**

When an admin opens a ticket, the system generates a draft response grounded in the BookLeaf knowledge base. The draft is **cached on the ticket record** so repeated opens don't trigger additional API calls. The admin sees the cached draft and can edit it before sending.

### Prompt Engineering

The system prompt embeds the full BookLeaf knowledge base (royalty policy, ISBN policy, printing turnarounds, distribution info, tone guidelines). The user prompt includes only the ticket content + minimal book data — not the full ticket history — keeping token counts low.

### Cost Awareness

| Scenario                  | API Calls | Approx. Cost        |
|---------------------------|-----------|---------------------|
| New ticket created        | 1 (async) | ~$0.0001            |
| Admin opens ticket (first)| 1 (sync)  | ~$0.0005            |
| Admin opens ticket (again)| 0 (cached)| $0                  |

### Graceful Degradation

- If the AI API is down: tickets are still created, classification fields remain null
- If draft generation fails: the API returns a 503 with a message; the admin sees an error notice and can write manually
- No UI elements break if AI is unavailable

---

## Architecture Decisions

### Monorepo (Next.js full-stack)
Combining frontend + API in one Next.js project simplifies deployment (single Vercel project), removes CORS concerns, shares TypeScript types, and reduces infrastructure complexity.

### SQLite for development
Zero setup overhead — just run migrations and seed. Prisma makes it trivial to swap to PostgreSQL for production (change one `DATABASE_URL` line and the schema provider).

### JWT in httpOnly Cookies
- httpOnly = XSS-proof (JS can't read the token)
- Cookie-based = works seamlessly with Next.js SSR
- Also supports Bearer header for programmatic clients (e.g. Postman)

### SSE over WebSockets
The real-time requirement is unidirectional (server → author client). SSE is simpler, reconnects automatically, works over HTTP/1.1, and requires no separate library.

### Async AI Classification
AI classification happens after the ticket creation response is returned to the author. This keeps ticket creation fast (<100ms) and doesn't block on a potentially slow AI API call.

---

## Known Limitations

1. **SSE is single-instance only** — the in-process `sseStore` won't work across multiple server instances. For multi-instance (Kubernetes, multiple Dynos), replace with Redis pub/sub.

2. **No email notifications** — adding Resend or SendGrid would be a natural next step.

3. **No file upload** — the attachment UI is present but doesn't submit files. Requires an S3 integration.

4. **SQLite in production** — fine for low-traffic deployments; a PostgreSQL connection (e.g. Neon, Railway) is recommended for production.

---

## Brief Write-Up

### What I Prioritised
I focused on the core ticket flow and AI integration first (the two highest-weighted criteria), then the API quality, then UI polish. The author ↔ admin interaction loop — submit ticket → AI classifies → admin opens with draft → edits → sends → author sees in real-time — is fully functional.

### Trade-offs Made
- Used SQLite instead of PostgreSQL to eliminate setup friction for the evaluator. Prisma makes this a one-line change for production.
- Used Next.js API routes instead of a separate Express backend. This reduces the surface area to maintain while keeping the architecture clean (each route is in its own file with a single responsibility).
- Chose SSE over WebSockets because the notification flow is purely server-to-author; the added complexity of WebSockets wasn't justified.
- AI calls are fire-and-forget for classification (non-blocking) but synchronous for draft generation (because the admin is actively waiting for it).

### How I'd Evolve This for Production
1. **PostgreSQL** (Neon/Railway) + **Redis** for SSE pub/sub across instances
2. **Email notifications** via Resend when ticket status changes or a response is sent
3. **File attachments** via S3-presigned URLs
4. **Rate limiting** on the ticket creation and AI draft endpoints
5. **Audit log** for admin actions (who changed what, when)
6. **Author self-service** updates — let authors update royalty bank account, book metadata via the portal
7. **Analytics dashboard** — ticket resolution times, AI classification accuracy over time
