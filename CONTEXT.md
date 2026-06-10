# PaisaOS — Complete Project Context

Use this file to start a new AI session with full context about the codebase.
Last updated: June 2026

---

## 1. What Is This App

**PaisaOS** is a personal finance PWA for Pakistan. Built for a single user (no multi-user). All money amounts are in Pakistani Rupees (₨).

**Live URL:** Deployed on Vercel, auto-deploys from `main` branch of `MukaramCodes/paisaos` on GitHub.

**Key features:**
- Wallet (income/expense/loan tracking)
- Money Flow (50/30/20 rule, live from wallet)
- Spending Autopsy (charts & analytics, live from wallet)
- Goals, Savings Pots, Net Worth, Calculators
- Offline-first: works without internet, syncs when back online
- PWA installable on Android and iOS

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (`app/` router) |
| Rendering | `output: 'export'` — 100% static HTML, no server |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Charts | Recharts |
| Icons | Lucide React |
| Hosting | Vercel (static deploy) |
| Auth | Custom — Name + Secret Key (NOT Supabase JWT) |

**There is no backend.** Everything is client-side. No API routes.

---

## 3. Repository & Deployment

```
GitHub repo:  MukaramCodes/paisaos
Main branch:  main  ← Vercel deploys from here
Deploy on:    every push to main (~2 min build)
```

**Git push command (must re-apply PAT every session):**
```bash
git remote set-url origin https://YOUR_GITHUB_PAT@github.com/MukaramCodes/paisaos.git
git push -u origin main
```

The default remote URL goes through a proxy (`127.0.0.1:...`) that blocks writes — always set the URL directly with a GitHub PAT before pushing.
Replace `YOUR_GITHUB_PAT` with a Personal Access Token from https://github.com/settings/tokens (needs `repo` scope).

---

## 4. Supabase Configuration

```
URL:  https://wvcmkpwancdsbljsutjx.supabase.co
Key:  sb_publishable_ASoow2xe9Yh-b4YeyJagYg_plz4jzrw  (anon/public key)
```

**File:** `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  'https://wvcmkpwancdsbljsutjx.supabase.co',
  'sb_publishable_ASoow2xe9Yh-b4YeyJagYg_plz4jzrw'
);
```

### Tables

#### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| user_id | text | matches `paisaos_uid` in localStorage |
| type | text | `'income' \| 'expense' \| 'loan_received' \| 'loan_payment' \| 'adjustment'` |
| amount | numeric | always positive |
| category | string | e.g. "Food & Dining" |
| note | text | optional |
| date | date | YYYY-MM-DD |
| loan_id | uuid nullable | links to loans table |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Check constraint** (must exist):
```sql
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income','expense','loan_received','loan_payment','adjustment'));
```

**RLS:**
```sql
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
```

#### `loans`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| user_id | text | |
| lender_name | text | |
| loan_amount | numeric | original amount |
| remaining_amount | numeric | decreases with payments |
| paid_amount | numeric | increases with payments |
| status | text | `'active' \| 'cleared'` |
| date_taken | date | |
| due_date | date nullable | |
| note | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:**
```sql
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON public.loans FOR ALL USING (true) WITH CHECK (true);
```

#### `user_data`
Used by the legacy localStorage sync system. Stores key/value pairs with timestamps.
| Column | Type |
|---|---|
| user_id | text PK composite |
| key | text PK composite |
| value | text (JSON stringified) |
| updated_at | timestamptz |

---

## 5. Authentication

**No Supabase Auth.** Custom identity:

1. User enters their Name + a Secret Key on the login page
2. App hashes Name+Key into a `uid` (deterministic)
3. `uid` and `name` stored in localStorage: `paisaos_uid`, `paisaos_username`
4. All Supabase queries use `eq('user_id', uid)` to filter

**File:** `lib/identity.ts` — contains the hashing logic

**AuthProvider** (`components/AuthProvider.tsx`):
- Reads uid/name from localStorage on mount
- Provides: `uid`, `name`, `loading`, `isOnline`, `syncError`, `dataVersion`, `pendingCount`
- `dataVersion` increments whenever cloud data changes — pages `useEffect([uid, dataVersion])` to auto-refresh
- `pendingCount` = number of offline-queued operations waiting to sync
- On `online` event: calls `flushQueue(uid)` then bumps `dataVersion`

---

## 6. Data Flow Architecture

### Two Separate Sync Systems

#### System A — `user_data` table (localStorage sync)
Used for: Net Worth assets/liabilities, Goals, Savings Pots, Money Flow settings, Income setting

- `lib/sync.ts` runs a `periodicSync` every 15 seconds
- Watches these localStorage keys: `paisaos_income`, `paisaos_assets`, `paisaos_liabilities`, `paisaos_spending`, `paisaos_goals`, `paisaos_pots`, `paisaos_flow`, `paisaos_username`, `paisaos_visited`
- On change: upserts to `user_data` table with timestamp
- On pull: compares timestamps, only overwrites if cloud is newer
- `migrateOrPull()` runs on login: if no cloud data → push everything; else pull everything

#### System B — `transactions` + `loans` tables (direct Supabase CRUD)
Used for: Wallet transactions, Loans

- `lib/transactions.ts` and `lib/loans.ts` call Supabase directly
- **Offline queue** (`lib/offlineQueue.ts`): if `navigator.onLine === false`, operations are saved to `localStorage['paisaos_offline_queue']` and replayed when network returns
- **Cache** (`lib/cache.ts`): last-fetched transactions/loans cached to localStorage per user for offline reads

### Offline Queue Format
```typescript
// localStorage key: 'paisaos_offline_queue'
// Array of QueueItem:
{
  id: string;           // 'q_1234_abc'
  op: 'addTx' | 'deleteTx' | 'addLoan' | 'payLoan' | 'deleteLoan';
  userId: string;
  payload: any;
  localId?: string;     // temp ID for add ops, starts with 'local_'
  createdAt: string;
}
```

Local IDs (prefix `local_`) are used until the item is synced and gets a real Supabase UUID.

---

## 7. File Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout, metadata, PWA tags, inline script for beforeinstallprompt
│   ├── globals.css             # Tailwind + iOS zoom fix + custom scrollbar
│   ├── page.tsx                # Landing page (redirects to /dashboard if paisaos_visited is set)
│   └── (app)/                  # Protected routes (requires auth)
│       ├── layout.tsx          # Auth guard + Sidebar + mobile header
│       ├── dashboard/page.tsx  # Main dashboard
│       ├── wallet/page.tsx     # Income/expense/loan CRUD + history
│       ├── money-flow/page.tsx # 50/30/20 rule, live from wallet
│       ├── spending-autopsy/page.tsx  # Analytics, charts, live from wallet
│       ├── goals/page.tsx      # Savings goals
│       ├── savings-pots/page.tsx
│       ├── net-worth/page.tsx  # Assets & liabilities
│       ├── calculators/page.tsx
│       └── account/page.tsx
│
├── components/
│   ├── AuthProvider.tsx        # Auth context, sync orchestration, online/offline
│   ├── Sidebar.tsx             # Nav + InstallPWA + SyncIndicator
│   ├── SyncIndicator.tsx       # Shows: Synced / Offline·N queued / Syncing N…
│   ├── InstallPWA.tsx          # Android: native prompt | iOS: Add to Home Screen guide
│   ├── UpdateBanner.tsx        # "New version available" service worker banner
│   ├── MetricCard.tsx          # Reusable stat card
│   └── SessionRedirect.tsx     # Redirects visited users from landing page to dashboard
│
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── transactions.ts         # Transaction CRUD + offline-aware + calculations
│   ├── loans.ts                # Loan CRUD + offline-aware
│   ├── offlineQueue.ts         # Queue system + flushQueue()
│   ├── cache.ts                # localStorage cache for transactions/loans
│   ├── sync.ts                 # System A: localStorage ↔ user_data sync
│   └── identity.ts             # Name+Key → uid hashing
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (fetch handler for installability)
│   ├── icon-192.png            # PWA icon (generated by scripts/gen-icons.mjs)
│   ├── icon-512.png
│   └── apple-touch-icon.png
│
├── scripts/
│   └── gen-icons.mjs           # Node script: generates ₨ symbol PNG icons
│
├── tailwind.config.js
└── next.config.js              # output: 'export', trailingSlash: true
```

---

## 8. Key Components — How They Work

### `app/(app)/wallet/page.tsx`
The central data entry page.

**FormMode:** `'income' | 'expense' | 'loan' | 'pay_loan' | null`

**Transaction types displayed:**
```typescript
const TX_STYLE = {
  income:        { icon: '↑', bg: 'bg-[#D8F3DC]', text: 'text-[#1B4332]',  tag: '' },
  expense:       { icon: '↓', bg: 'bg-red-50',    text: 'text-red-500',     tag: '' },
  loan_received: { icon: '←', bg: 'bg-blue-50',   text: 'text-blue-600',   tag: 'Loan In' },
  loan_payment:  { icon: '→', bg: 'bg-orange-50', text: 'text-orange-600', tag: 'Loan Pay' },
  adjustment:    { icon: '~', bg: 'bg-gray-100',  text: 'text-gray-500',   tag: 'Adj' },
};
```

**Balance = THIS MONTH only** (not all-time cumulative). Each new month starts fresh.
- Month picker in history section lets user browse past months.
- Balance card turns red + says "⚠ Overdrawn This Month" when balance < 0.

**Loans:** Each active loan has two buttons:
- **Partial** — enter custom amount
- **Pay Full** — one tap, clears entire remaining amount

**Expense custom category:** Dropdown has "✏ Custom…" at the bottom; selecting it shows a free-text input.

### `lib/transactions.ts` — Key functions
```typescript
calcWallet(txs)     // returns { balance, totalIn, totalOut, loanIn, loanOut }
                    // balance = income + loan_received − expense − loan_payment

thisMonthTxs(txs)   // filter to current calendar month

spendByCategory(txs) // groups 'expense' type only, sorted by amount desc

filterByMonth(txs, 'YYYY-MM')  // for history browsing

availableMonths(txs) // unique months from transaction dates, newest first

fmt(n)  // formats: negative → '-₨ 3,000', positive → '₨ 3,000'
```

### `app/(app)/money-flow/page.tsx`
Live from wallet. No manual items.
- Income = sum of `income` type transactions this month
- Expenses auto-classified:
  - **Needs** (default): Food & Dining, Transport, Bills & Utilities, Health, Housing, Education
  - **Wants** (default): Shopping, Entertainment, Clothing, Other, any custom category
- User can tap `→ Wants` / `→ Needs` on any row to reclassify; saved to `localStorage['paisaos_flow_classify']`
- Savings = income − needs − wants
- 50/30/20 rule check and bar chart

### `app/(app)/spending-autopsy/page.tsx`
Pure analytics — no data entry buttons.
- Reads wallet transactions
- Income = `income` type only (NOT `loan_received`)
- Migration banner: detects old `paisaos_spending` localStorage entries, offers to import them as wallet expenses
- Charts: pie chart (categories), weekly bar chart (needs vs wants), category breakdown

### `components/InstallPWA.tsx`
```
Android/Chrome/Edge → captures beforeinstallprompt → shows "Install App" button
iOS Safari          → always shows "Add to Home Screen" guide
Already installed   → hides button
```

The `beforeinstallprompt` event fires before React mounts, so it's captured by an inline script in `app/layout.tsx`:
```html
<script>window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});</script>
```
The component reads `window.__pwaPrompt` on mount.

---

## 9. Color Palette

```css
--bg-cream:       #F4EFE6   /* page background */
--forest-dark:    #1B4332   /* primary dark green */
--forest-mid:     #2D6A4F
--forest-accent:  #40916C   /* medium green */
--forest-light:   #74C69D   /* light green */
--forest-pale:    #D8F3DC   /* pale green tint */
--ink:            #1C1C1C   /* body text */
```

---

## 10. Common Issues & Their Fixes

### Git push fails (403 / proxy error)
The remote URL defaults to a local proxy that blocks writes. Fix every session:
```bash
git remote set-url origin https://YOUR_GITHUB_PAT@github.com/MukaramCodes/paisaos.git
```

### Supabase `transactions_type_check` constraint violation
If new transaction types (loan_received, loan_payment) are rejected:
```sql
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income','expense','loan_received','loan_payment','adjustment'));
```

### Supabase RLS warning emails
```sql
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON public.loans FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
```

### Vercel build errors — unescaped characters in JSX
React requires `"` → `&ldquo;` / `&rdquo;`, `'` → `&apos;` inside JSX text.

### iOS Safari auto-zoom on input focus
Fixed in `app/globals.css`:
```css
input, select, textarea { font-size: 16px !important; }
```

### Mobile content overflowing right edge
Fixed in `app/(app)/layout.tsx`:
```tsx
<div className="flex min-h-screen overflow-x-hidden">
  <Sidebar />
  <main className="flex-1 min-w-0 lg:ml-60 ...">
```
`min-w-0` is required on flex children to prevent them from overflowing.

### PWA install button not showing
Requires a service worker with a `fetch` handler:
```js
// public/sw.js
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
```

### Viewport/zoom issues on mobile
Use Next.js 14's `Viewport` export — NOT raw `<meta name="viewport">` in `<head>` (ignored by App Router):
```typescript
// app/layout.tsx
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
```

---

## 11. Deployment Workflow

```
1. Make code changes
2. npm run build   ← always verify locally before pushing
3. git add <files>
4. git remote set-url origin https://YOUR_GITHUB_PAT@github.com/MukaramCodes/paisaos.git
5. git push -u origin main
6. Vercel auto-detects push → builds → deploys (~2 min)
7. Web users: refresh browser
8. Mobile PWA users: pull-to-refresh or close & reopen
```

No manual Vercel uploads. No Play Store updates needed for content changes.

---

## 12. localStorage Keys Reference

| Key | Used by | Content |
|---|---|---|
| `paisaos_uid` | Auth | user's unique ID |
| `paisaos_username` | Auth | display name |
| `paisaos_visited` | Landing redirect | `'true'` once user visits dashboard |
| `paisaos_income` | Dashboard, Money Flow | monthly income number (string) |
| `paisaos_assets` | Net Worth | JSON array of `{id, name, amount, category}` |
| `paisaos_liabilities` | Net Worth | JSON array of `{id, name, amount}` |
| `paisaos_goals` | Goals | JSON array of goal objects |
| `paisaos_pots` | Savings Pots | JSON array of pot objects |
| `paisaos_flow` | Money Flow (legacy) | old manual flow items |
| `paisaos_flow_classify` | Money Flow | `{[category]: 'Needs'\|'Wants'}` overrides |
| `paisaos_spending` | Legacy | old spending categories (now migrated to wallet) |
| `paisaos_offline_queue` | Offline sync | JSON array of QueueItem |
| `paisaos_cache_txs_{uid}` | Offline reads | cached transactions array |
| `paisaos_cache_loans_{uid}` | Offline reads | cached loans array |

---

## 13. PWA / Icons

Icons are generated by `scripts/gen-icons.mjs` — a pure Node.js script that draws the ₨ symbol on a `#1B4332` background using pixel-level PNG encoding (no image libraries).

```bash
node scripts/gen-icons.mjs
# generates: public/icon-192.png, icon-512.png, apple-touch-icon.png
```

Current scale: `0.38` (in the script). Maskable safe zone requires content within center 80% circle (radius = 0.40 × size).

---

## 14. Current State (June 2026)

### Working
- Wallet: income, expense, custom categories, loans (partial/full pay), month filter
- Dashboard: live wallet balance (this month only), real-time greeting, dynamic stats
- Money Flow: fully synced from wallet, Needs/Wants auto-classify, reclassifiable
- Spending Autopsy: pure analytics from wallet, old data migration banner
- Offline-first: all wallet CRUD works offline, auto-syncs on reconnect
- PWA: installable on Android (native prompt) and iOS (manual guide)
- Mobile layout: no horizontal overflow, no iOS zoom lock

### Known Limitations
- Net Worth, Goals, Savings Pots still use localStorage sync (System A), not direct Supabase CRUD
- No transaction editing (only add + delete)
- No recurring transactions
- No budget alerts/notifications
- Calculators page is purely computational (no data persistence)
