# SplitSmart Prototype (CIS 285 Lab 9)

A web prototype for sharing expenses within groups. Built with Next.js 15 (App Router), React 19,
TypeScript, Tailwind CSS 4, Prisma 6, and SQLite.

## Features

| Req | Feature |
| --- | --- |
| FR1 | Create groups and pick one from the dashboard cards or the sidebar (pills on mobile) |
| FR2 | Add members to a group. Empty names, duplicate names, and invalid group IDs are rejected |
| FR3 | Record an expense with a description, a positive amount, a payer, participants, and a date. It is split equally in integer cents |
| FR4 | Expense history for each group (description, amount, payer, participants with shares, date), stored in SQLite |
| FR5 | Net balance per member (paid minus share), color-coded. Balances always sum to $0.00 |

### Money rules
- Amounts are parsed from text into **integer cents** without floating-point math. Zero,
  negative, non-numeric, and >2-decimal amounts are rejected, and so is anything over $1,000,000.
- **Equal split with a set remainder rule:** each participant gets `floor(amount / n)` cents.
  The leftover `amount % n` cents go one each to the participants with the **lowest member IDs**.
  Example: $10.00 split three ways gives 334 + 333 + 333 = 1000 cents.
- Each participant's share is saved (`ExpenseShare`), so a later change to the split rule won't
  rewrite past expenses.

## Setup

```bash
cp .env.example .env          # DATABASE_URL="file:./dev.db" (creates prisma/dev.db)
npm install                   # installs from package-lock.json
npx prisma migrate deploy     # applies prisma/migrations (non-destructive)
```

## Run

```bash
npm run dev                   # http://localhost:3000 (development)
npm run build && npm start    # production
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test                      # Vitest: unit + Prisma integration tests
```

Integration tests run against a separate database, `prisma/test.db`, which is rebuilt from
migrations each run. They never touch `dev.db`.

## Structure

```
src/lib/money.ts          Pure money logic: parsing, equal split, balances (no DB/UI)
src/lib/validation.ts     Input validation (IDs, names, dates, participants)
src/lib/splitsmart.ts     Server-side service layer (all Prisma access)
src/app/api/groups/...    JSON API route handlers
src/app/...               Server-rendered pages + loading / error / not-found states
src/components/...        UI components (client forms, balances, history)
tests/                    Vitest suites
```

### API

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/groups` | — |
| POST | `/api/groups` | `{ "name": "Trip" }` |
| GET | `/api/groups/:id` | — (members, expenses, balances) |
| POST | `/api/groups/:id/members` | `{ "name": "Alice" }` |
| POST | `/api/groups/:id/expenses` | `{ "description", "amount": "60.00", "payerId", "participantIds": [..], "date"?: "YYYY-MM-DD" }` |

Validation errors return `400` (`404` for an unknown group, `409` for a duplicate member) with
`{ "error": string, "field"?: string }`.

## Out of scope (by design)
Authentication, payments/settlements, approvals, notifications, percentage splits, receipts, and
editing or deleting expenses and members.
