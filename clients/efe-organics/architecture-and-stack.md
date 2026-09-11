# Technical Architecture & Stack: Efe Organics

**Engineering Organization:** Aksen Labs  
**Repository:** `c:\Users\HP\Desktop\Alberta\efe-organics`  
**Target Domain:** `https://efeorganics.com` (redirects apex to `www.efeorganics.com`)  

---

## 1. System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│          (Mobile Web, Android Chrome, WhatsApp)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / Anycast DNS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                       │
│    Anycast DNS (NS1/NS2.VERCEL-DNS.COM)                     │
│    Next.js 16 (App Router + Turbopack + React 19)            │
│    Edge Middleware: src/proxy.ts (Clerk / Cookie Admin Gate)│
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Neon PostgreSQL         │ │      External Services     │
│   - Relational Catalog       │ │ - Paystack (GH MoMo/Cards) │
│   - Variants & Stock Ledger  │ │ - Clerk (Auth Studio)      │
│   - Minor-Unit Pesewas       │ │ - Blotato (Social Engine)  │
│   - Drizzle ORM (Zero Binary)│ │ - OpenRouter (AI Gateway)  │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Core Stack Decisions & Engineering Rationale

### A. Next.js 16 + React 19 + Tailwind v4
- **RSC-First**: Instant First Contentful Paint on mobile connections across West Africa.
- **Server Actions**: Native mutations with strict payload validation (`12mb` ceiling configured in `next.config.ts` for spreadsheet and PDF trade exports).
- **Edge Middleware Convention**: Next 16 uses `src/proxy.ts` (not `middleware.ts`). This isolates admin paths and Clerk auto-proxy routes (`/__clerk/*`) without injecting overhead into public e-commerce routes.

### B. Database: PostgreSQL (Neon) + Drizzle ORM
- **Relational Seam**: Clean separation between `products` (shelf entity) and `variants` (sellable SKU carrying size, stock, and price).
- **Integer Minor-Unit Money**: All prices stored as `bigint` pesewas (`7000` = GH₵70.00). Floating-point arithmetic is strictly prohibited.
- **Transactional Stock Ledger**: Every inventory change is an immutable entry with an attribution reason, ensuring bulk quarter-tonne wholesale orders (`250kg`) cannot create race conditions with concurrent retail shoppers.
- **Drizzle ORM**: Selected over Prisma due to zero binary footprint, SQL-shaped queries, and reviewable plain SQL migrations (`drizzle/` directory).

### C. Payments: Paystack Ghana
- Native support for MTN Mobile Money, Telecel Cash, and cards.
- Webhook signature validation (`POST /api/paystack/webhook`) using HMAC SHA512 guarantees safe order fulfillment without manual transaction receipts.

---

## 3. Hostinger vs. Vercel Hosting Strategy

- **Storefront & Edge Engine**: Deployed on **Vercel** for automatic CI/CD, global Anycast DNS, edge caching, and zero server maintenance.
- **Business Email**: Hosted on **Hostinger Business Email** (Titan Mail) via MX records (`hello@efeorganics.com`), resolving the previous missing mailbox vulnerability.
