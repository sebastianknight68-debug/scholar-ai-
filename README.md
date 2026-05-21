# ScholarAI

A SaaS study tool that turns voice recordings, uploaded files, and notes into AI-powered study materials — transcripts, smart notes, flashcards, quizzes, summaries, and a tutor chat.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (auth + Postgres + RLS), Anthropic Claude (Sonnet 4), OpenAI Whisper, and Stripe.

## What's in the box

```
app/
├── (auth)/login, signup          Email/password + Google OAuth
├── auth/callback, signout         Session bridge
├── dashboard/                     Sidebar shell, study-set list
│   ├── new/                       Voice recorder + drag-drop uploads + paste notes
│   ├── set/[id]/                  6-tab study-set viewer
│   ├── billing/, settings/        Plan management
├── api/
│   ├── transcribe                 Whisper transcription
│   ├── parse-file                 PDF, DOCX, PPTX, image (vision OCR)
│   ├── generate-study-set         Parallel Claude calls
│   ├── chat                       Streaming tutor chat
│   └── stripe/checkout, webhook   Subscription flow
components/
├── ui/                            shadcn-style primitives
├── landing/                       Nav, Footer
├── auth/                          AuthForm
├── dashboard/                     Sidebar, StudySetCard, UsageBar
├── new/                           VoiceRecorder, FileUploader, NotesInput, SourceList, UpgradeModal
├── study/                         TranscriptTab, NotesTab, FlashcardsTab, QuizTab, SummaryTab, ChatTab
├── billing/                       CheckoutButton
lib/
├── supabase/                      Browser / server / admin / middleware clients
├── ai/generate.ts                 Claude prompt orchestration + mock fallbacks
├── parse/pptx.ts                  Pure-JS PPTX text extraction
├── prompts.ts, plans.ts, types.ts, markdown.tsx, utils.ts, anthropic.ts, openai.ts, stripe.ts
supabase/schema.sql                Tables + RLS + monthly-usage RPC
middleware.ts                      Protects /dashboard
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and create a project.
- In the dashboard, open the **SQL editor**, paste in `supabase/schema.sql`, and run it. This creates the tables, RLS policies, the user-profile trigger, and the monthly-usage RPC.
- In **Authentication → Providers**, enable **Email** (with confirmations on or off, your call) and **Google** if you want OAuth.
- In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` (and add your production URL later).
- Copy `Project URL`, `anon` key, and `service_role` key.

### 3. Create Stripe products (optional — for billing)

```bash
# Student — $9/mo
stripe products create --name="ScholarAI Student"
stripe prices create --product=<id> --unit-amount=900 --currency=usd \
    --recurring[interval]=month
# Pro — $19/mo
stripe products create --name="ScholarAI Pro"
stripe prices create --product=<id> --unit-amount=1900 --currency=usd \
    --recurring[interval]=month
```

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the `whsec_…` it prints into STRIPE_WEBHOOK_SECRET
```

### 4. Configure environment

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

| Variable                            | Where to get it                                  | Required for                  |
| ----------------------------------- | ------------------------------------------------ | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase → Project Settings → API                | Everything                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Supabase → Project Settings → API                | Everything                    |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase → Project Settings → API (keep secret)  | API routes                    |
| `ANTHROPIC_API_KEY`                 | console.anthropic.com                            | Notes/quiz/flash/summary/chat |
| `OPENAI_API_KEY`                    | platform.openai.com                              | Audio transcription           |
| `STRIPE_SECRET_KEY`                 | Stripe → Developers → API keys                   | Subscriptions                 |
| `STRIPE_WEBHOOK_SECRET`             | `stripe listen` output                           | Subscription updates          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| Stripe → Developers → API keys                   | Future client-side Stripe     |
| `STRIPE_PRICE_ID_STUDENT`           | Stripe → Products → price id                     | Student plan checkout         |
| `STRIPE_PRICE_ID_PRO`               | Stripe → Products → price id                     | Pro plan checkout             |
| `NEXT_PUBLIC_APP_URL`               | e.g. `http://localhost:3000`                     | Auth + Stripe redirects       |

**Mock mode:** if `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` are missing, the affected routes return safe placeholder responses so you can develop the UI without keys.

### 5. Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Design system

- Background `#0F0F1A`, card `#1A1A2E`, elevated `#22223F`
- Primary `#6C63FF`, accent `#22D3EE`
- Inter typeface, dark mode by default, mobile responsive

## Notes on architecture

- **RLS everywhere.** All Supabase tables are row-level-secured; reads from server components run under the user's session, writes from API routes use the service-role client only after re-checking ownership.
- **Plan limits are server-side.** `/api/generate-study-set` checks plan + monthly usage before any AI calls, returning HTTP 402 if the free quota is exhausted. The frontend opens the upgrade modal on 402.
- **Parallel generation.** Smart notes, flashcards, quiz, summary, and title are produced via `Promise.all` against Claude Sonnet 4.
- **Streaming chat.** `/api/chat` opens a `messages.stream` and pipes deltas back over `text/plain` so the client can render token-by-token.
- **PPTX parsing.** We unzip the file in-process and pull text from each `<a:t>` element — no native dependency.

## Deploying

- Vercel works out of the box. Add all env vars in the Vercel project settings.
- Point Stripe's live webhook at `https://YOUR_DOMAIN/api/stripe/webhook` and update `STRIPE_WEBHOOK_SECRET`.
- Update Supabase Auth URLs to include your production domain.
