# ⭐ StarGap

> You starred repos meaning to learn them. You bookmarked articles meaning to read them. You never came back. StarGap finds which ones are blowing up on HackerNews right now — before the moment passes.

**Built for Pirates of the Coral-bean Hackathon · WeMakeDevs × Coral**

---

## What It Does

StarGap is a personal developer signal agent. It runs **cross-source SQL JOINs** across three live data sources using [Coral](https://withcoral.com) to answer one question:

> *Which technologies am I repeatedly saving but never acting on — and are they trending right now?*

It surfaces the overlap between:
- **GitHub starred repos** — what you bookmarked to build with
- **DEV.to reading list** — what you bookmarked to learn from
- **HackerNews front page** — what's blowing up right now

No single platform gives you this. The insight only exists in the JOIN.

---

## Demo

![StarGap UI](public/demo.png)

> *"You starred ollama, langchain, and fastapi. All three have trending HN stories today. You've been circling this stack for months."*

---

## Architecture

```
Browser → Next.js API Route → execSync(coral sql) → Coral Query Engine
                                                           ├── github.activity_list_repos_starred_by_user
                                                           ├── hackernews.top_stories
                                                           └── devto.reading_list
                                    ↓
                             Gemini 2.0 Flash (insight generation)
                                    ↓
                             JSON response → UI
```

---

## Coral SQL Queries

**Query 1 — GitHub Stars × HackerNews**
```sql
SELECT
  json_get_str(g.json, 'name') AS repo,
  json_get_str(g.json, 'language') AS language,
  hn.title AS hn_story,
  hn.points,
  hn.url
FROM github.activity_list_repos_starred_by_user g
JOIN hackernews.top_stories hn
  ON LOWER(hn.title) LIKE '%' || LOWER(json_get_str(g.json, 'language')) || '%'
  OR LOWER(hn.title) LIKE '%' || LOWER(json_get_str(g.json, 'name')) || '%'
WHERE g.username = :username
  AND hn.points IS NOT NULL
ORDER BY hn.points DESC;
```

**Query 2 — DEV.to Reading List × HackerNews**
```sql
SELECT
  d.title AS devto_article,
  hn.title AS hn_story,
  hn.points
FROM devto.reading_list d
JOIN hackernews.top_stories hn
  ON LOWER(d.tag_list) LIKE '%' || LOWER(SPLIT_PART(hn.title, ' ', 1)) || '%'
  OR LOWER(d.tag_list) LIKE '%' || LOWER(SPLIT_PART(hn.title, ' ', 2)) || '%'
WHERE hn.points IS NOT NULL
ORDER BY hn.points DESC;
```

---

## Coral Sources Used

| Source | Type | Tables Used |
|--------|------|-------------|
| `github` | Bundled | `activity_list_repos_starred_by_user` |
| `hackernews` | **Custom source spec** (`devto.yaml`) | `top_stories`, `search_stories` |
| `devto` | **Custom source spec** (`devto.yaml`) | `reading_list` |

> The HackerNews and DEV.to sources are custom-built for this project. The HackerNews source spec is submitted separately for the custom source bounty.

---

## Setup

### Prerequisites
- [Coral CLI](https://withcoral.com/docs) installed (`brew install withcoral/tap/coral`)
- Node.js 18+
- GitHub personal access token (repo read scope)
- DEV.to API key (`dev.to/settings/extensions`)
- Gemini API key (`aistudio.google.com/apikey`)

### 1. Add Coral Sources

```bash
# GitHub (bundled)
coral source add --interactive github

# HackerNews (custom — no API key needed)
coral source add --file ./hackernews.yaml

# DEV.to (custom)
export DEVTO_API_KEY=your_key_here
coral source add --file ./devto.yaml
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
GITHUB_USERNAME=your_github_username
GEMINI_API_KEY=your_gemini_key
DEVTO_API_KEY=your_devto_key
```

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → click **Run Analysis**.

---

## MCP Integration

StarGap exposes Coral as an MCP server, letting you query your developer signals directly from Claude Desktop.

Add to your Claude Desktop MCP config:
```json
{
  "mcpServers": {
    "coral": {
      "command": "coral",
      "args": ["mcp"]
    }
  }
}
```

Then ask Claude: *"Which of my GitHub stars are trending on HackerNews today?"*

---

## Project Structure

```
app/
  page.tsx                 ← Main UI
  api/analyze/route.ts     ← API route (runs Coral queries + Gemini insight)
lib/
  coral.ts                 ← Coral CLI wrapper + query logic
  gemini.ts                ← Gemini 2.0 Flash insight generation
hackernews.yaml            ← Custom Coral source spec for HackerNews
devto.yaml                 ← Custom Coral source spec for DEV.to
coral.mcp.json             ← MCP server config for Claude Desktop
```

---

## Why Coral

The insight StarGap produces is **impossible without cross-source JOINs**. You can't get this by:
- Opening GitHub and filtering stars
- Checking HackerNews manually
- Browsing your DEV.to reading list

Coral makes a three-way JOIN across live external APIs feel like a local SQL query. That's the entire point.

---

## Hackathon Track

**Track 2 — Personal Agent**

Built solo by [@Sarvesh5273](https://github.com/Sarvesh5273)