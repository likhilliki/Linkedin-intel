# Workspace

## Overview

pnpm workspace monorepo — LinkedIn Intelligence & Job Scraper Agent with AI-powered extraction, Qdrant dedup, and Google Sheets sync.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + Tailwind CSS + Recharts + Framer Motion

## Agent Architecture

The scraper agent flow:
1. **Apify** scrapes LinkedIn posts/jobs by keyword (`curious_coder/linkedin-post-search-scraper`, `bebity/linkedin-jobs-scraper`)
2. **Qdrant** deduplication: checks if `post_id` already processed (vector store with `text-embedding-3-small`)
3. **GPT-4o-mini** extracts all 20 fields from raw post text (structured JSON output)
4. **Google Sheets** appends new rows with all 20 columns
5. **PostgreSQL** stores all records for the dashboard

## Required Secrets

- `APIFY_API_KEY` - Apify account API key
- `QDRANT_URL` - Qdrant cloud cluster URL (e.g. https://xyz.qdrant.io:6333)
- `QDRANT_API_KEY` - Qdrant cloud API key
- `OPENAI_API_KEY` - OpenAI API key (for embeddings + extraction)
- `GOOGLE_SHEET_ID` - Google Sheet ID (from URL)
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Full service account JSON with Sheets editor access

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API + agent orchestration
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── agent.ts      # Main orchestrator
│   │       │   ├── apify.ts      # LinkedIn scraper via Apify
│   │       │   ├── extractor.ts  # GPT-4o-mini field extractor
│   │       │   ├── qdrant.ts     # Vector dedup + semantic search
│   │       │   └── sheets.ts     # Google Sheets writer
│   │       └── routes/
│   │           ├── scraper.ts    # POST /api/scraper/run, GET /api/scraper/status/:id
│   │           ├── keywords.ts   # GET/POST/DELETE /api/keywords
│   │           └── jobs.ts       # GET /api/jobs, GET /api/jobs/stats
│   └── linkedin-dashboard/ # React + Vite dashboard
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/
│       └── src/schema/
│           ├── keywords.ts      # keywords table
│           ├── scraperRuns.ts   # scraper_runs table
│           └── jobRecords.ts    # job_records table (all 20 columns)
└── scripts/
```

## API Endpoints

- `POST /api/scraper/run` — trigger scraper with optional keywords + maxResults
- `GET /api/scraper/status/:runId` — poll run progress
- `GET /api/scraper/runs` — list all runs
- `GET /api/keywords` — list keywords
- `POST /api/keywords` — add keyword
- `DELETE /api/keywords/:id` — remove keyword
- `GET /api/jobs` — list job records (filterable)
- `GET /api/jobs/stats` — statistics

## Google Sheet Schema (20 columns)

Post ID | Role | Company Name | Location | Primary Skills | Secondary Skills | Must To Have | Years of Experience | Looking For College Students | Intern | Salary Package | Email | Phone | Hiring Intent | Author Name | Author LinkedIn URL | Post URL | Date Posted | Date Processed | Keyword Matched

## Qdrant Collection

Collection: `linkedin_posts`
- Vector size: 1536 (text-embedding-3-small)
- Distance: Cosine
- Payload: post_id, role, company, primary_skills, keyword
- Used for: duplicate detection by post_id + semantic skill matching
