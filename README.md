<div align="center">
  <img src="public/logo.jpg" width="110" alt="ISO CERT INTERNATIONAL" />

# ISO CERT INTERNATIONAL — Certification Management System

Full-stack web system for an ISO certification body — from client application to certification decision and annual surveillance.
<br/>نظام ويب متكامل لإدارة دورة حياة شهادات الأيزو — إنجليزي افتراضياً مع تبديل كامل للعربية (RTL).

**Next.js 14 · TypeScript · Tailwind CSS · Supabase · Claude AI**
</div>

---

## Sign in / الدخول

| | |
|---|---|
| Email | `admin@isocert.com` |
| Password | `IsoCert@2026` |

> ⚠️ Change the password after first login (Supabase → Authentication).
> Public clients can apply without login via **`/register`** (application is auto-registered as a pending client).

## Run locally / التشغيل

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` (copy from `.env.example`) — currently wired to the **"iso system"** Supabase project (`mgkjvkyownnsbrqtbsvf`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://mgkjvkyownnsbrqtbsvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Modules / الوحدات

| Module | Description |
|---|---|
| **Language switch** | English by default; one click (header globe) flips the whole UI — including navigation, pages and form chrome — to Arabic RTL |
| **Dashboard** | Live KPIs + charts (monthly audits, standards distribution, monthly NCs) + activity feed + upcoming audits |
| **Statistics** | Clients by status, NCs by status, standards distribution, auditor workload |
| **Clients** | Search/filter/pagination + full client file with tabs (details, audits, forms, **attachments**, NCs, history) + 3-year lifecycle indicator |
| **Client Audit Files** | Dedicated section: per-client audit files & site photos with inline upload (Supabase Storage) |
| **Certificates** | Issued certificates with validity state (valid / expiring soon / expired / suspended), 3-year progress bar, print-ready certificate (F06-14) |
| **New Client Wizard** | 3 steps: company info → standards + IAF codes + increase/decrease factors → review + **automatic audit-day calculation** |
| **Audit page** | Plan + clause-by-clause results with C/O/NCR buttons — NCR **auto-creates an NC report** |
| **NC Tracker** | 4-column drag-and-drop kanban (Open → Response Received → Under Review → Closed) |
| **Auditors** | Color-coded monthly calendar + booking with instant checks (standard cert + IAF cert + date conflict → OK/NOT OK) + **Add Auditor** with role, standards & IAF codes |
| **Auditor Files** | CVs, certificates and contracts per auditor with upload |
| **Forms Center** | **18 official forms** (F06-01 → F06-18) — **yellow cells are the variables**, auto-filled from the database, editable, saved per client, printed as an official document (incl. designed Certificate F06-14) |
| **Users & Roles** | Settings → create users with roles (admin / lead auditor / auditor / viewer), promote admins, delete users — via secure Postgres RPCs (admin-only) |
| **AI Assistant** | Chatbot wired to the live DB: statistics, day calculation, search, adding clients & NCs. Works locally out of the box; add a **Claude API key in Settings** for full natural-language understanding with real execution tools |

## Audit-day calculation / منطق الحساب

Matches the reference calculator `ISO_CERT_AUDIT_CALCULATOR_WITH_AUDITORS.xlsx` 100%:

1. Base days by employee band (14 bands: 1-5 → 1.5 MD … 1176-1550 → 14 MD) × selected standards
2. **MD5** reduction up to 20% (reviewer input) — **MD9** fixed 20% for ISO 13485 — **MD11** integration 20% (integrated + >1 standard)
3. Round to nearest half day
4. Split: Stage 1 = 30% · Stage 2 = 70% · Surveillance = ⅓ · Recertification = ⅔

**Verified acceptance case:** 10 employees, 3 integrated standards → base 6 → −20% MD11 → 4.8 → **5 days** (S1=1.5, S2=3.5, SUR=1.5, RC=3.5) ✓

## Database / قاعدة البيانات

21 tables with RLS + Storage bucket (`client-files`) + admin-only user-management RPCs (`create_app_user`, `set_user_role`, `delete_app_user`) + anon insert policy for the public application form — see [supabase/schema.sql](supabase/schema.sql).

**Seeded data:** 6 standards, the 10 official IAF codes (28, 37, 34, 32, 33, 35, 1.7, 36, 31, 29), 14 calculation bands, **19 real auditors** with their certifications, all reduction factors, 8 clients (incl. WRASS REAL ESTATES with its real file: calculation, Stage 1/2, two closed NCs, 3-year program), 15 audits, 8 NC reports, calendar bookings, activity log and notifications.

### Migrating to another Supabase project

1. Supabase → SQL Editor: run `supabase/schema.sql` then `supabase/seed.sql`
2. Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

## Enable full AI / تفعيل الذكاء الكامل

Settings → Claude API Key → paste a key from [console.anthropic.com](https://console.anthropic.com) → Save.
Without a key the assistant runs in local mode (stats/calc/search/add with confirmation). With a key: free natural language + 6 execution tools with confirmation before any data change.

## Structure / البنية

```
app/
├── (app)/               # protected pages
│   ├── dashboard/  statistics/
│   ├── clients/ (+new, +[id])   audit-files/   certificates/
│   ├── audits/ (+[id])          nc-tracker/
│   ├── auditors/                auditor-files/
│   ├── forms/ (+[code])         settings/
│   ├── calculator/              audit-program/
├── register/            # public client application form (no login)
├── login/
├── api/                 # backend
│   ├── calculator/                 # calculation engine + persist
│   ├── auditor-planning/check/     # certification & conflict checks
│   └── ai/chat/                    # AI assistant (Claude API / local) — streaming
components/   (layout, ui, chat)
lib/          (i18n, supabase, calculator, ai/tools, forms/definitions, types)
supabase/     (schema.sql, seed.sql)
```

## Deploy / النشر

Import the repo in Vercel → add the two env vars → Deploy.

---
<div align="center">ISO CERT INTERNATIONAL · iso-cert.uk</div>
