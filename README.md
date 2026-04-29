<div align="center">

# 🛒 NexCart

### A full-stack, AI-native eCommerce platform.
Browse, cart, track orders, and check out — through chat or the classic UI.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-tool_calling-412991?logo=openai)](https://platform.openai.com)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-635bff?logo=stripe)](https://stripe.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#-license)

[Demo](#) · [Architecture](#-architecture-deep-dive) · [Security](#-security) · [Deployment](#-deployment-guide)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Why This Project Is Impressive](#-why-this-project-is-impressive)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture Deep Dive](#-architecture-deep-dive)
- [AI Chatbot — Capabilities & Tools](#-ai-chatbot--capabilities--tools)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Deployment Guide](#-deployment-guide)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌐 Overview

**NexCart** is a production-grade eCommerce application where the **AI shopping assistant is a first-class citizen**, not a bolted-on chatbot. Customers can complete an entire purchase — discovery, cart management, navigation, checkout, order tracking — through natural language, while the classic UI continues to work exactly as expected.

The chatbot is wired to real, validated, server-enforced operations through **OpenAI tool calling**. Every cart mutation, every navigation, every order lookup goes through the same guarded API surface that the UI uses — so the AI gains no privileges the user doesn't have.

| | |
|---|---|
| 🏪 **Storefront** | Catalog, search, filtering, pagination, product details, cart, Stripe-hosted checkout, order history |
| 🤖 **AI Assistant** | 11 server-validated tools, real-time NDJSON streaming, page-aware context, persistent conversation memory |
| 🛡️ **Admin** | Full CRUD on products, orders, users, plus analytics dashboard |
| 🔐 **Auth** | JWT cookie auth with `bcryptjs` hashing, role-based access (`USER` / `ADMIN`), route guards via Next.js 16 `proxy.ts` |
| 💳 **Payments** | Stripe Checkout with verified webhook order updates |

---

## 🏆 Why This Project Is Impressive

> Built to demonstrate end-to-end product engineering — not just CRUD with a chat overlay.

### Engineering decisions that matter

- **AI is a thin layer over real APIs, not a parallel universe.** Every tool call hits the same Prisma queries the UI uses, so business rules, auth, and validation can never drift between the two surfaces.
- **Server-enforced authorization on every tool.** The model is treated as untrusted input. Cart, order, and admin operations re-verify the JWT inside the tool executor — the AI cannot escalate privilege via a crafted prompt.
- **Streaming protocol designed for tool calling.** `/api/ai/chat` emits **newline-delimited JSON events** (`text`, `tool_call`, `tool_result`, `client_action`, `notification`, `done`) so the UI can render product cards, fire toasts, and trigger navigation **mid-response** without waiting for completion.
- **Strict type safety across the stack.** `TypeScript strict` + `Zod 4` validation at every API boundary + `Prisma 7` with the new `@prisma/adapter-pg` driver adapter.
- **Page-aware context injection.** The active route, current cart snapshot, and category list are injected into the system prompt every turn — `"buy it"` while on `/product/abc123` resolves automatically.
- **Production-shaped error handling.** Out-of-stock, repeated tool failure, anonymous tool calls, off-topic queries, and destructive actions (clear-cart) all have **explicit, tested behaviors**.

### Why recruiters should care

| What they're looking for | Where it shows up |
|---|---|
| System design judgment | AI / API / DB layered cleanly; tool executors are pure functions |
| Security-conscious development | JWT verified server-side per tool, prompt-injection mitigations, Stripe webhook signature checks, Zod validation everywhere |
| Modern frontend | Next.js 16 App Router, React 19, Zustand with persist, Framer Motion, streaming UI |
| Real-world integrations | OpenAI tool calling + streaming, Stripe Checkout + webhooks, PostgreSQL via Prisma adapter |
| Operational thinking | Migration path documented (SQLite → Postgres), deployment guide, troubleshooting matrix, env-var hygiene |

---

## ✨ Features

### 🤖 AI

- **Floating chat assistant** with smooth Framer Motion micro-interactions
- **11 OpenAI tool functions** — search, recommend, cart CRUD, navigation, order tracking, checkout
- **Live store context injected per turn** — cart contents, current page, available categories
- **Real-time NDJSON streaming** with token-level deltas and a blinking caret
- **Stop / Retry controls** for any in-flight or failed response
- **Server-driven toast notifications** and route changes
- **Per-tool auth guards** — anonymous calls return `AUTH_REQUIRED` and the client redirects to `/login`
- **Conversation memory** persisted to `localStorage` (last 30 messages)
- **Destructive actions always confirm first** (e.g., clear cart)
- **AI product generator** at `/admin/ai-product` — describe an idea, GPT writes the listing (title, description, category, price), DALL·E renders the image, admin previews then publishes to PostgreSQL with one click

### 📣 Social

- **Dynamic Open Graph tags** on every product page — Facebook/Twitter shares show the product image, title, and description
- **One-click Facebook share button** on every product page (popup window, brand-correct mark)
- **Auto-post to Facebook Page** when a product is published — best-effort; failures never block the DB insert

### 🛍️ eCommerce

- Email + password auth with **JWT cookies** and **bcrypt**
- **Cart system** backed by Zustand (with persistence) and synced after every AI action
- **Stripe Checkout** with verified webhook order updates
- **Order history** + individual order tracking
- Product catalog with **search, category filter, sort, pagination**
- **Route protection** via Next.js 16 `proxy.ts`
- **Admin panel** — products / orders / users / analytics

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack, `proxy.ts`) |
| **UI** | React 19.2 · TailwindCSS 4 · Framer Motion 12 · Lucide Icons |
| **State** | Zustand 5 with `persist` middleware |
| **Database** | PostgreSQL 16 via Prisma 7 + `@prisma/adapter-pg` |
| **Auth** | JWT (cookie-based) · `bcryptjs` |
| **Payments** | Stripe SDK · Stripe Checkout · webhook signature verification |
| **AI** | OpenAI SDK · function/tool calling · NDJSON streaming |
| **Validation** | Zod 4 |
| **Forms** | React Hook Form + Hookform Resolvers |
| **Notifications** | react-hot-toast |
| **Language** | TypeScript (strict mode) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.9+ (required by Next.js 16)
- **npm** 9+
- **PostgreSQL** 14+ — local, Docker, or hosted (Neon / Supabase / Railway / RDS)
- *Optional:* **Stripe** test account (for checkout), **OpenAI** API key (for the AI assistant)

### 1. Install

```bash
git clone https://github.com/your-username/nexcart.git
cd nexcart
npm install
```

### 2. Provision PostgreSQL

The fastest path is Docker:

```bash
docker run --name nexcart-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nexcart \
  -p 5432:5432 -d postgres:16
```

Or grab a free hosted Postgres from **Neon** / **Supabase** / **Railway** and copy the connection string.

### 3. Configure environment

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexcart?schema=public"
JWT_SECRET="change-me-to-a-long-random-string"
OPENAI_API_KEY=sk-your-openai-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See [Environment Variables](#-environment-variables) for the full list.

### 4. Initialize the database

```bash
npm run db:migrate    # apply schema
npm run db:seed       # seed users + 8 sample products across 5 categories
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000> 🎉

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| 👨‍💼 Admin | `admin@nexcart.local` | `admin1234` |
| 👤 User | `user@nexcart.local` | `user1234` |

> ⚠️ **Always rotate these credentials** before any public deployment.

---

## 🧠 Architecture Deep Dive

### High-level layout

```
┌────────────┐    POST /api/ai/chat      ┌────────────────┐
│  Browser   │ ─── messages + page ────▶│  AI Gateway    │
│ ChatWidget │ ◀── NDJSON stream ────── │ (Node runtime) │
└─────┬──────┘                           └───────┬────────┘
      │                                          │
      │  Zustand store (cart / auth / products)  │  OpenAI tool calls
      │                                          ▼
┌─────▼────────┐   fetch / mutations    ┌────────────────────┐
│  Next.js UI  │ ─────────────────────▶ │  Tool Executors    │
│  (App Router)│                        │  (auth + Zod)      │
└──────────────┘                        └─────────┬──────────┘
                                                  │
                                          ┌───────▼────────┐
                                          │ Prisma 7 + PG  │
                                          └────────────────┘
```

### Request lifecycle — classic UI

1. Client renders a Server Component (catalog page) → Prisma query runs server-side, HTML streamed.
2. Mutations (cart, login, checkout) hit a Route Handler under `app/api/*`.
3. Each handler: **parse cookie → verify JWT → Zod-validate body → Prisma mutation → JSON response**.
4. The Zustand store mirrors the server state on the client and persists to `localStorage`.

### Request lifecycle — AI chat (tool calling flow)

```
┌─ POST /api/ai/chat
│
├─ 1. Verify JWT cookie       → ToolContext { userId, role | guest }
├─ 2. Build live store context → { cart, categories, currentPath }
├─ 3. Build system prompt     → intent matrix + few-shots + context
│
├─ 4. Loop (max 6 iterations to prevent runaway agents):
│     │
│     ├─ Call OpenAI Chat Completions (stream=true, tools=[...11])
│     │   ├─ Stream text deltas → emit {type:"text", delta}
│     │   └─ Collect tool_calls
│     │
│     ├─ For each tool_call:
│     │   ├─ Zod-validate args
│     │   ├─ Re-check auth (if tool requires it)
│     │   ├─ Execute via Prisma
│     │   ├─ Emit {type:"tool_result", ...}
│     │   ├─ Optionally emit {type:"client_action", action}     ◀── navigate, cart_update
│     │   └─ Optionally emit {type:"notification", level, msg}  ◀── toast
│     │
│     └─ Feed tool results back to OpenAI as `role: "tool"` messages
│
└─ 5. Emit {type:"done"} and close the stream
```

### How frontend, backend, and DB connect

| Concern | Implementation |
|---|---|
| **State sync** | Zustand `cartStore.fetchCart()` fires whenever the AI emits a `cart_update` action — every cart UI in the app refreshes in real time |
| **Navigation** | Server emits `client_action: { type:"navigate", path }` → client calls `router.push(path)` — paths are validated against an **allowlist** before being sent |
| **Auth boundary** | The single source of truth for "who is calling" is the JWT cookie. **Tool executors re-verify it** rather than trusting the prompt or the client |
| **Schema source of truth** | `prisma/schema.prisma`. Migrations live in `prisma/migrations/` and are committed to git |
| **Driver adapter** | Prisma 7 + `@prisma/adapter-pg` — uses `pg` directly, allowing edge-friendly deploys |

### Project layout

```
nexcart/
├── app/                     # Next.js App Router (routes + API)
│   ├── api/ai/chat/         # 🤖 AI streaming endpoint
│   ├── api/auth/            # login / register / me / logout
│   ├── api/cart/            # cart + cart items
│   ├── api/checkout/        # Stripe session create / verify
│   ├── api/orders/          # user orders
│   ├── api/admin/           # admin-only API (role-gated)
│   ├── api/stripe/webhook/  # Stripe webhook receiver
│   ├── admin/               # admin panel pages
│   ├── (auth)/              # /login, /register
│   └── ...                  # storefront, cart, checkout, orders
│
├── components/
│   ├── ai/                  # 🤖 ChatWidget, ChatMessage, types
│   ├── admin/               # admin-only components
│   ├── cart/ · product/     # cards, forms
│   └── providers/
│
├── lib/
│   ├── ai/
│   │   ├── tools.ts         # tool definitions + executors (auth + Zod)
│   │   ├── systemPrompt.ts  # intent matrix + few-shots
│   │   └── context.ts       # live cart / categories / page fetcher
│   ├── auth/jwt.ts          # JWT sign / verify
│   ├── db/prisma.ts         # Prisma singleton (driver adapter)
│   └── stripe.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/          # source of truth, committed
│   └── seed.ts
│
├── stores/                  # Zustand: auth, cart, products
├── proxy.ts                 # route guard (Next 16 replacement for middleware.ts)
└── next.config.ts
```

---

## 🤖 AI Chatbot — Capabilities & Tools

Click the floating launcher in the bottom-right of any page.

| Capability | Example prompt |
|---|---|
| 🔍 Search products | *"Show me running shoes under $80"* |
| 📦 Get product details | *"Tell me more about the Nike Pegasus"* |
| ✨ Recommend similar | *"Suggest something like the iPhone 15"* |
| ➕ Add to cart | *"Add 3 of the cheapest"* |
| ✏️ Update quantity | *"Make it 5"* |
| ➖ Remove item | *"Drop the headphones"* |
| 🧹 Clear cart | *"Empty my cart"* (always confirms first) |
| 🧾 Read cart | *"What's in my cart?"* |
| 📜 List orders | *"Show my recent orders"* |
| 🔎 Track an order | *"Where is order #ABC123?"* |
| 🧭 Navigate | *"Go to checkout"* |
| 💳 Drive checkout | *"Buy everything in my cart"* |

### The 11 server-side tools

| Tool | Auth | Purpose |
|---|:--:|---|
| `searchProducts` | — | Filter catalog by query, category, price, sort |
| `getProductById` | — | Full detail for one product |
| `getRecommendations` | — | Find similar items |
| `getCart` | ✅ | Read user's cart |
| `addToCart` | ✅ | Add an item |
| `updateCartQuantity` | ✅ | Change line quantity |
| `removeFromCart` | ✅ | Remove a line |
| `clearCart` | ✅ | Empty the cart (always confirms) |
| `getOrders` | ✅ | List recent orders |
| `getOrderById` | ✅ | Order detail (auth + ownership) |
| `navigate` | — | Send the user to an internal page (allowlisted) |

### Edge-case behaviors

- **Out of stock** → suggests the available quantity instead of failing
- **Empty cart at checkout** → suggests products
- **Not logged in for guarded tool** → routes to `/login` with a friendly toast
- **Off-topic query** → polite redirect back to shopping
- **Repeated tool failure** → apologizes and points to the manual route

### Example conversations

**Browse → add → checkout (lazy mode)**

```
👤  show me cheap shoes under $50
🤖  Here are the most affordable shoes under $50.
    [grid of 6 product cards rendered]

👤  add the cheapest one
🤖  Added Cotton Runner at $29.99.

👤  actually make it 3
🤖  Updated to 3.

👤  checkout
🤖  Taking you to checkout — total $89.97.
    → page navigates to /checkout
```

**Page-aware reference**

```
[user is browsing /product/abc123 — Nike Pegasus]

👤  buy it
🤖  Added Nike Pegasus to your cart.
    → "it" automatically resolved to current product
```

---

## 📦 Order Tracking

End-to-end order lifecycle is tracked in PostgreSQL on the `Order` model and exposed through dedicated user and admin surfaces. No third-party order-management service is required.

### Status lifecycle

The `OrderStatus` enum models the full purchase-to-delivery flow:

| Status | When it's set | Set by |
|---|---|---|
| `PENDING` | Order row created at checkout, before payment confirms | App (Stripe checkout) |
| `PAID` | Stripe webhook confirms successful payment | `/api/stripe/webhook` |
| `SHIPPED` | Admin marks the order shipped | Admin via UI |
| `DELIVERED` | Admin marks delivery complete | Admin via UI |
| `CANCELLED` | Order cancelled (refund, OOS, customer request) | Admin via UI |

Every transition writes Prisma's `updatedAt`, so the user-facing detail page can show "Last updated".

### How users track orders

| Page | What it shows |
|---|---|
| [`/orders`](app/orders/page.tsx) | All of the signed-in user's orders, newest first. Each card shows order ID, date, total, a colored status badge, and item thumbnails. |
| [`/orders/[id]`](app/orders/[id]/page.tsx) | Full detail — order info (id, date, last-updated, total), every line item with image, quantity, and unit + line totals, and a status badge with icon (Package / CheckCircle / Truck / XCircle). |

The status badge uses semantic colors: PENDING=yellow, PAID=green, SHIPPED=blue, DELIVERED=purple, CANCELLED=red — consistent across both pages.

### How admins manage orders

| Page | What it shows |
|---|---|
| [`/admin/orders`](app/admin/orders/page.tsx) | All orders across the store with filters (status, search) and pagination. |
| [`/admin/orders/[id]`](app/admin/orders/[id]/page.tsx) | Customer details, shipping address, line items, payment intent, and a `<select>` dropdown to change `status`. A "Cancel Order / Restore Order" toggle button is also provided. |

Status changes go through `PATCH /api/admin/orders/[id]/status` — admin-only, zod-validated against the `OrderStatus` enum, returns the updated order with parsed images for instant UI refresh.

### Security model

| Boundary | Enforcement |
|---|---|
| User can only view their own orders | `GET /api/orders/[id]` uses `findFirst({ where: { id, userId } })` — never `findUnique({ where: { id } })`, so a guessed/stolen ID returns 404 not 403. |
| Only admins can change status | `PATCH /api/admin/orders/[id]/status` checks `payload.role !== 'ADMIN'` → 403. |
| Tokens validated server-side | Every endpoint calls `verifyToken(cookies.get('token'))`. The proxy layer also gates `/orders/*` from logged-out users. |
| Status enum enforced at the boundary | Zod `z.enum([...])` rejects any value outside the OrderStatus literal set, preventing arbitrary string injection into the column. |

### AI chat integration

The chat assistant has a `getOrderById` tool — a logged-in user can ask *"Where is order #ABC123?"* and the assistant fetches the order via the same authenticated path, including ownership check ([lib/ai/tools.ts](lib/ai/tools.ts)).

### Optional future enhancements

These are **not** implemented today; mention them only if you want true courier-grade tracking:

- `trackingNumber String?` and `courierInfo Json?` on the `Order` model — would let admins enter a carrier's tracking number and have the user-facing detail page link out to the courier's tracking site.
- A `PROCESSING` enum value between `PAID` and `SHIPPED` for warehouses that need a fulfilment-in-progress state distinct from "payment received."
- A `OrderStatusHistory` model writing one row per transition for an audit trail / timeline view.

All three are purely additive (nullable columns, new enum values, new model) and would not break any existing flow.

---

## 🌐 API Reference

### Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List products (search, category, paginate) |
| `GET` | `/api/products/[id]` | Get single product |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Log in (sets JWT cookie) |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Current user |

### Cart · Checkout · Orders

| Method | Endpoint | Description |
|---|---|---|
| `GET / POST` | `/api/cart` | Get cart / add item |
| `PUT / DELETE` | `/api/cart/items/[id]` | Update or remove line |
| `POST` | `/api/checkout/create-session` | Create Stripe checkout session |
| `POST` | `/api/checkout/verify-session` | Verify after redirect |
| `POST` | `/api/stripe/webhook` | Stripe webhook (signature-verified) |
| `GET` | `/api/orders` | List user's orders |
| `GET` | `/api/orders/[id]` | Get single order |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | NDJSON-streaming chat with OpenAI tool calling |
| `POST` | `/api/ai/generate-product` | **Admin** — generate a product preview (title, description, category, price, image URL). No DB write. |
| `POST` | `/api/admin/ai/publish-product` | **Admin** — persist a generated preview as a real `Product` row and (optionally) auto-share to Facebook |
| `POST` | `/api/facebook/post` | **Admin** — post a product (title, image, URL) to a configured Facebook Page |

**Request**
```json
{
  "messages": [{ "role": "user", "content": "Show me cheap shoes" }],
  "pageContext": { "path": "/products" }
}
```

**Response — newline-delimited JSON events**
```
{"type":"text","delta":"Here are "}
{"type":"text","delta":"some shoes "}
{"type":"tool_call","name":"searchProducts","args":{"query":"shoes","sort":"price_asc"}}
{"type":"tool_result","name":"searchProducts","result":{"ok":true,"data":{...}}}
{"type":"notification","level":"success","message":"Added 1 × Nike Pegasus to cart."}
{"type":"client_action","action":{"type":"navigate","path":"/cart"}}
{"type":"done"}
```

### Admin

`/api/admin/*` — gated to `role: ADMIN`. Includes products, orders, users, analytics, dashboard.

---

## 🔐 Security

> Security posture is a primary design goal of NexCart, not an afterthought.

### 🪪 JWT & session security

- **HttpOnly, Secure, SameSite=Lax cookies** — JWTs are never readable from JavaScript, mitigating XSS-based session theft.
- **Server-side verification on every request** — Route Handlers and AI tool executors both verify the cookie via `lib/auth/jwt.ts`. The client is never trusted.
- **Strong secret requirement** — `JWT_SECRET` must be a long, random string in production. Rotating it invalidates all sessions, by design.
- **bcrypt password hashing** with per-user salt via `bcryptjs`. Plaintext passwords never leave the request handler.
- **Role-based authorization** — admin routes are gated both at the `proxy.ts` layer and again at the API handler.

### 🤖 AI safety & prompt-injection defense

- **The model is treated as untrusted input.** Every tool executor independently:
  1. Re-verifies the JWT cookie,
  2. Zod-validates arguments against a strict schema,
  3. Enforces ownership (e.g., `getOrderById` checks `order.userId === ctx.userId`).
- **Allowlisted navigation** — the `navigate` tool can only send users to a hardcoded set of internal paths. The model cannot redirect to arbitrary URLs or external domains.
- **Iteration cap** — the chat loop terminates after **6 tool-call iterations** to prevent runaway agents or infinite tool loops.
- **Confirmation-gated destructive actions** — `clearCart` always asks for explicit user confirmation before executing.
- **System prompt is constructed server-side** and is never exposed to or modifiable by the client.
- **No tool returns raw database errors** — failures are mapped to safe, user-facing messages.

### 🛡️ Rate limiting

- AI chat and auth endpoints are designed to sit behind a rate limiter (Vercel + Upstash, Cloudflare, or platform-native). The streaming protocol is also self-throttled by an iteration cap so a single request cannot trigger unbounded model usage.

### ✅ Input validation

- **Zod 4 schemas at every API boundary** — request bodies, query params, and tool arguments.
- **Prisma's typed query layer** prevents SQL injection by construction.
- **Form-side validation** via React Hook Form + Hookform Resolvers gives users early feedback while the server still re-validates.

### 💳 Stripe webhook verification

- Webhook payloads at `/api/stripe/webhook` are **verified with `stripe.webhooks.constructEvent`** using `STRIPE_WEBHOOK_SECRET` and the raw request body. Unsigned or tampered events are rejected with `400`.
- Order status mutations only run after a verified `checkout.session.completed` event.

### 🔒 Environment variable safety

- `.env` is **gitignored**; only `.env.example` should ever be committed.
- **Public vs server split is enforced** — only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser bundle. `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `JWT_SECRET`, and `DATABASE_URL` are server-only.
- **Fail-fast on startup** — missing critical env vars throw immediately with a clear message rather than failing silently at first request.
- For production, use the host's secret manager (Vercel Environment Variables, AWS Secrets Manager, Doppler, etc.) and **never** paste secrets into a deploy script.

---

## 🚢 Deployment Guide

### Recommended stack

| Concern | Service |
|---|---|
| Hosting | **Vercel** (zero-config for Next.js 16) |
| Database | **Neon** or **Supabase** (managed Postgres with free tier) |
| Payments | **Stripe** (live mode) |
| AI | **OpenAI** API |

### 1. Provision a managed Postgres

Pick one:

- **Neon** — <https://neon.tech> → create project → copy the pooled connection string
- **Supabase** — <https://supabase.com> → Project Settings → Database → URI

Append `?sslmode=require` to the URL if it isn't there already.

### 2. Push code to GitHub

```bash
git remote add origin git@github.com:your-username/nexcart.git
git push -u origin main
```

### 3. Import into Vercel

1. <https://vercel.com/new> → Import the repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `next build` (default).
4. Add environment variables (see below).
5. Deploy.

### 4. Production environment variables

Set these in Vercel → Project → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=<64-char random string>
OPENAI_API_KEY=sk-live-...
OPENAI_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 5. Apply migrations to production

After the first deploy, run **once**:

```bash
DATABASE_URL="<production-url>" npm run db:migrate:deploy
DATABASE_URL="<production-url>" npm run db:seed   # optional — only for first launch
```

Or wire `prisma migrate deploy` into your Vercel build command:

```bash
prisma migrate deploy && next build
```

### 6. Wire the Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
2. URL: `https://your-domain.com/api/stripe/webhook`.
3. Events: `checkout.session.completed`, `checkout.session.expired`.
4. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET` and redeploy.

### ✅ Production checklist

- [ ] `JWT_SECRET` is a fresh 64+ char random string
- [ ] Seed admin/user passwords have been **rotated** or seeding is disabled in production
- [ ] `DATABASE_URL` includes `sslmode=require`
- [ ] Stripe is in **live mode** with a verified webhook endpoint
- [ ] OpenAI key has a hard spend limit set
- [ ] Rate limiting enabled at the edge (Vercel + Upstash, Cloudflare, etc.)
- [ ] Domain has HTTPS (handled automatically by Vercel)
- [ ] `NEXT_PUBLIC_APP_URL` matches the live domain (required for Stripe redirects)
- [ ] Logs / monitoring configured (Vercel Observability, Sentry, or similar)
- [ ] `.env` is **not** committed; production secrets live only in the host's secret manager

---

## 🔑 Environment Variables

```env
# ─── Database ─────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"

# ─── Auth ─────────────────────────────────────────────────
JWT_SECRET="long-random-string"

# ─── AI (optional but recommended) ────────────────────────
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3

# ─── Stripe (optional — checkout only) ────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── Facebook auto-share (optional) ───────────────────────
FACEBOOK_PAGE_ID=000000000000000
FACEBOOK_PAGE_ACCESS_TOKEN=EAAG...
# FACEBOOK_GRAPH_VERSION=v21.0

# ─── App ──────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Seed overrides (optional) ────────────────────────────
# SEED_ADMIN_EMAIL=admin@nexcart.local
# SEED_ADMIN_PASSWORD=admin1234
# SEED_USER_EMAIL=user@nexcart.local
# SEED_USER_PASSWORD=user1234
```

| Variable | Required | Notes |
|---|:--:|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `JWT_SECRET` | ✅ | Long random string for JWT signing |
| `OPENAI_API_KEY` | ⚠️ | Required for the AI chatbot and AI product generator |
| `OPENAI_MODEL` | ❌ | Text model. Defaults to `gpt-4o-mini` |
| `OPENAI_IMAGE_MODEL` | ❌ | Image model for the AI product generator. Defaults to `dall-e-3` |
| `STRIPE_*` | ⚠️ | Required for checkout |
| `NEXT_PUBLIC_APP_URL` | ⚠️ | Public origin. Required in production for Stripe redirects, OG tags, and Facebook auto-share |
| `FACEBOOK_PAGE_ID` | ❌ | Numeric Page ID. Without it, AI publish skips the auto-share silently |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | ❌ | Long-lived Page token with `pages_manage_posts` |
| `FACEBOOK_GRAPH_VERSION` | ❌ | Defaults to `v21.0` |

---

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create / apply a migration in development |
| `npm run db:migrate:deploy` | Apply pending migrations in production |
| `npm run db:push` | Push schema changes without a migration (prototyping) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:seed` | Reseed the database |
| `npm run setup` | `migrate deploy` + `generate` + `seed` |

---

## 🩺 Troubleshooting

<details>
<summary><strong>🚪 Port 3000 already in use</strong></summary>

```bash
npx next dev -p 3001
```
</details>

<details>
<summary><strong>🤖 "AI is not configured"</strong></summary>

Add `OPENAI_API_KEY=sk-...` to `.env` and restart the dev server.
</details>

<details>
<summary><strong>🤖 OpenAI rate-limited</strong></summary>

Your OpenAI account is being throttled. Wait, or upgrade your tier at <https://platform.openai.com/account/limits>.
</details>

<details>
<summary><strong>💾 Prisma client out of sync after schema change</strong></summary>

```bash
npm run db:migrate && npm run db:generate
```
For prototyping only:
```bash
npm run db:push && npm run db:generate
```
</details>

<details>
<summary><strong>🐘 ECONNREFUSED 127.0.0.1:5432</strong></summary>

- Confirm Postgres is running: `pg_isready` or `docker ps`
- Verify host / port / user / password / database in `DATABASE_URL`
- Hosted providers usually require `?sslmode=require`
</details>

<details>
<summary><strong>🐘 "DATABASE_URL is not set"</strong></summary>

There's no SQLite fallback. Set `DATABASE_URL` in `.env` and restart.
</details>

<details>
<summary><strong>🌐 "PrismaClient is not configured to run in this browser environment"</strong></summary>

You're importing `@/lib/db/prisma` from a Client Component. Only import it from Server Components, Route Handlers, or Server Actions.
</details>

<details>
<summary><strong>💳 "Stripe is not configured"</strong></summary>

Add real Stripe test keys to `.env` (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`) and restart.
</details>

<details>
<summary><strong>🛒 Cart UI doesn't update after AI action</strong></summary>

DevTools → Network → check that the `cart_update` event arrived in the `/api/ai/chat` stream and that `/api/cart` returned 200.
</details>

<details>
<summary><strong>🔑 Login redirects in a loop</strong></summary>

`JWT_SECRET` likely changed. Clear cookies for the host and log in again.
</details>

<details>
<summary><strong>🔄 Migrating from SQLite to Postgres</strong></summary>

The fastest path is `pgloader`:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate:deploy
pgloader sqlite://./prisma/dev.db postgresql://postgres:postgres@localhost:5432/nexcart
```

Verify with `psql "$DATABASE_URL" -c '\dt'`. PascalCase model names become quoted (`"User"`) — that's expected.
</details>

---

## 🗺️ Roadmap

- 🌍 Multi-language AI assistant
- 🗣️ Voice input (Web Speech API)
- 🎨 Light / dark theme
- 📱 PWA support
- 🔍 Vector search for semantic discovery (pgvector)
- ❤️ Wishlist with AI suggestions
- ⭐ Product reviews with AI summarization
- 📊 AI-powered admin sales analytics
- 📧 Transactional emails (Resend / Postmark)
- 🏪 Multi-vendor marketplace mode

---

## 📄 License

Released under the [MIT License](LICENSE). Use it, fork it, ship it.

---

<div align="center">

Built with **Next.js 16**, **OpenAI**, **Prisma 7**, and **PostgreSQL**.

⭐ If this project is useful, leave a star — it helps a lot.

</div>
