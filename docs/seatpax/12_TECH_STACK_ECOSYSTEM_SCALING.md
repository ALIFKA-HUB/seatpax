# Seatpax — Tech Stack, Third Parties & Scaling


> Modular documentation extracted from the Seatpax master specification.


# 24. Final Tech Stack Recommendation

## 24.1 Core

| Layer | Stack |
|---|---|
| Language | TypeScript |
| Full-stack framework | Next.js |
| UI | React |
| Styling | Tailwind CSS |
| Component primitives | shadcn/ui |
| Icons | Lucide |
| Validation | Zod |
| ORM / SQL layer | Drizzle ORM + PostgreSQL driver |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Tenant enforcement | Server authorization + Supabase RLS |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage bila perlu |
| Payment | Midtrans Sandbox |
| Seat Builder | Click-cell grid for MVP; dnd-kit optional for drag-and-drop enhancement |
| QR generation | Local JS library |
| QR scanning | Browser camera + QR scanner library |
| Crew client | Responsive PWA |
| Hosting | Vercel Hobby untuk portfolio |
| Unit/integration testing | Vitest |
| E2E | Playwright |
| Load test | k6 |
| Error monitoring | Sentry optional |

## 24.2 Kenapa Next.js satu aplikasi

Karena MVP tidak lagi membutuhkan native Bluetooth printing atau offline cash-sale kompleks.

Satu codebase dapat menangani:

```text
Passenger Web
Admin PO Web
Crew PWA
Super Admin Web
```

Routes:

```text
/search
/trips/[id]
/checkout
/tickets/[id]
/admin/*
/crew/*
/superadmin/*
```

## 24.3 Modular monolith

**FINAL:** Jangan microservices dulu.

```text
Next.js Modular Monolith
        ↓
PostgreSQL
```

Modul dipisah secara code boundary supaya jika suatu hari perlu:

```text
Next.js Frontend
      ↓
NestJS API
```

domain tidak perlu ditulis ulang.

---


# 25. Third-Party Ecosystem

## 25.1 Supabase

Dipakai sebagai satu provider untuk:

- PostgreSQL,
- Auth,
- RLS,
- Realtime,
- Storage optional.

Tujuan: mengurangi jumlah vendor pada demo.

## 25.2 Midtrans Sandbox

Dipakai untuk payment demo end-to-end.

Jangan menggunakan uang real.

## 25.3 Notification

Production concept:

```text
WhatsApp → fallback SMS
```

MVP:

```text
MockNotificationProvider
```

Interface:

```text
sendTicket()
sendClaimLink()
sendTripReminder()
```

Future adapters:

```text
WhatsAppProvider
SmsProvider
EmailProvider
```

## 25.4 QR

Tidak perlu external QR SaaS.

Generate sendiri dari application code.

## 25.5 Maps

**DEFERRED:** Tidak perlu Google Maps pada MVP.

Stop cukup memiliki nama, kota, dan alamat.

## 25.6 Monitoring

Sentry optional di fase polish.

---


# 26. Scalability Strategy

## 26.1 Yang harus dibedakan

```text
1 juta booking tersimpan
```

berbeda dari:

```text
5.000 user berebut seat yang sama dalam waktu bersamaan
```

Problem kedua lebih kritis untuk correctness.

## 26.2 Scale level 0 — Portfolio Rp0

```text
Next.js
Vercel Hobby
Supabase Free
Midtrans Sandbox
Mock Notification
```

## 26.3 Scale level 1 — Real users kecil

```text
Vercel paid / equivalent
Supabase paid compute
Connection pooling
Monitoring
```

Tidak perlu ubah domain.

## 26.4 Scale level 2 — Traffic meningkat

Tambahkan bila bottleneck nyata muncul:

```text
Redis
Queue Worker
Background jobs
Caching
Rate limiting
```

Gunakan queue untuk:

- notification,
- ticket PDF,
- reports,
- non-critical webhook side effects.

## 26.5 Scale level 3 — API separation

```text
Next.js frontend
      ↓
Dedicated NestJS API
      ↓
PostgreSQL
Redis
Workers
```

## 26.6 Scale level 4 — Very large system

Baru pertimbangkan:

```text
API Gateway
Inventory Service
Booking Service
Payment Service
Notification Service
Message Broker
Read Replicas
Redis Cluster
CDN/Object Storage
```

Kafka, Kubernetes, dan sharding bukan requirement awal.

---
