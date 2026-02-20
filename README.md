# Kairos - Holiday Planning

A mobile-first holiday planning app for couples. Plan holidays and work-from-abroad days, track allowances, and see UK bank holidays on a 24-month calendar.

## Features

- **24-month calendar** with UK (England & Wales) bank holidays
- **Two users** with separate holiday and work-from-abroad allowances
- **Configurable reset dates** (e.g. 1 January, 4 April)
- **Shared events** – create holidays for just you or both of you
- **Balance tracking** – see remaining days at a glance

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration in `supabase/migrations/001_initial.sql`
3. Enable **Email** auth in Authentication > Providers
4. Copy your project URL and anon key from Settings > API

### 2. Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Link with your partner

1. Sign up with your email
2. Your partner signs up with their email
3. In Settings, enter your partner's email and click **Link**
4. You can now create events together and see each other's balances

## Tech Stack

- Next.js 16, React 19, Tailwind CSS
- Supabase (Auth + PostgreSQL)
- date-fns
- UK bank holidays from [GOV.UK](https://www.gov.uk/bank-holidays.json)
