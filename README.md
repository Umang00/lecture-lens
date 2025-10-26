# Lecture Lens - Cohort Assistant

AI-powered chat interface that transforms your cohort's entire curriculum into a searchable knowledge base.

## Overview

Lecture Lens allows students to ask natural language questions and receive instant answers with precise citations from lectures (with timestamps) and auto-scraped resources.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL 15 + pgvector)
- **AI/ML**: OpenRouter (Gemini + OpenAI embeddings), LlamaIndex
- **Deployment**: Vercel

## Setup Instructions

### Prerequisites

- Node.js 20+
- Supabase account
- OpenRouter account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd lecture-lens
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Copy `.env.local` and fill in your credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `OPENROUTER_API_KEY` - Your OpenRouter API key

4. Setup database

Run the migration scripts in `lib/db/migrations/` in your Supabase SQL editor.

5. Seed demo data (optional)
```bash
npm run seed
```

6. Start development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
lecture-lens/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Student/instructor dashboard
│   ├── (admin)/           # Admin pages
│   └── api/               # API routes
├── lib/                   # Core logic
│   ├── db/               # Database client & schema
│   ├── auth/             # Authentication utilities
│   ├── vtt/              # VTT parsing & processing
│   ├── ai/               # AI/ML utilities
│   ├── scrapers/         # Resource scrapers
│   └── rag/              # RAG implementation
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Auth components
│   ├── chat/             # Chat interface
│   └── admin/            # Admin components
├── types/                 # TypeScript types
└── public/               # Static assets
```

## Features

- ✅ VTT lecture processing with semantic chunking
- ✅ Auto-scraping of GitHub, YouTube, and blog resources
- ✅ Unified vector search across all content
- ✅ Context-aware chat with conversation history
- ✅ Multi-cohort authentication with RLS
- ✅ Hybrid ranking with title matching
- ✅ Comprehensive timestamped summaries

## Test Credentials

**Student**: student@cohort5.com / demo123
**Instructor**: instructor@cohort5.com / demo123
**Admin**: admin@100x.com / demo123

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Documentation

See `Key_Docs/` for comprehensive documentation:
- `prd_cohort_assistant.txt` - Product Requirements
- `tech_architecture_doc.txt` - Technical Architecture
- `database_api_spec.txt` - Database Schema & API Spec
- `master_todo_list.txt` - Implementation Plan

## License

MIT
