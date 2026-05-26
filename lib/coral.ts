import { execSync } from 'child_process'

export interface StarGapResult {
  repo: string
  language: string
  devto_article: string
  hn_story: string
  points: number
  hn_url: string
}

export interface SourceStats {
  github_stars: number
  devto_bookmarks: number
  hn_stories: number
}

function parseCoralTable(raw: string, columns: string[]): Record<string, string>[] {
  const lines = raw.trim().split('\n')
  const headerIndex = lines.findIndex(l => columns.some(col => l.includes(`| ${col}`)))
  if (headerIndex === -1) return []
  const dataLines = lines.slice(headerIndex + 2).filter(l =>
    l.startsWith('|') && !l.startsWith('+')
  )
  return dataLines.map(line => {
    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    const obj: Record<string, string> = {}
    columns.forEach((col, i) => { obj[col] = cols[i] || '' })
    return obj
  }).filter(row => Object.values(row).some(v => v !== ''))
}

function runQuery(query: string): string {
  const clean = query.replace(/\s+/g, ' ').trim()
  return execSync(`coral sql "${clean.replace(/"/g, '\\"')}"`, {
    encoding: 'utf-8',
    timeout: 45000,
  })
}

export function getStarredCount(username: string): number {
  try {
    const result = runQuery(
      `SELECT COUNT(*) as cnt FROM github.activity_list_repos_starred_by_user WHERE username = '${username}'`
    )
    const lines = result.trim().split('\n')
    const dataLine = lines.find(l => l.startsWith('|') && !l.includes('cnt') && !l.startsWith('+'))
    return parseInt(dataLine?.split('|')[1]?.trim() || '0') || 0
  } catch { return 0 }
}

export function getDevtoCount(): number {
  try {
    const result = runQuery(`SELECT COUNT(*) as cnt FROM devto.reading_list`)
    const lines = result.trim().split('\n')
    const dataLine = lines.find(l => l.startsWith('|') && !l.includes('cnt') && !l.startsWith('+'))
    return parseInt(dataLine?.split('|')[1]?.trim() || '0') || 0
  } catch { return 0 }
}

export function getHNCount(): number {
  try {
    const result = runQuery(`SELECT COUNT(*) as cnt FROM hackernews.top_stories`)
    const lines = result.trim().split('\n')
    const dataLine = lines.find(l => l.startsWith('|') && !l.includes('cnt') && !l.startsWith('+'))
    return parseInt(dataLine?.split('|')[1]?.trim() || '0') || 0
  } catch { return 0 }
}

export function runStarGapQuery(username: string): StarGapResult[] {
  // Query 1: GitHub stars JOIN HackerNews
  const query1 = `
    SELECT
      json_get_str(g.json, 'name') AS repo,
      json_get_str(g.json, 'language') AS language,
      '' AS devto_article,
      hn.title AS hn_story,
      hn.points,
      hn.url AS hn_url
    FROM github.activity_list_repos_starred_by_user g
    JOIN hackernews.top_stories hn
      ON LOWER(hn.title) LIKE '%' || LOWER(json_get_str(g.json, 'language')) || '%'
      OR LOWER(hn.title) LIKE '%' || LOWER(json_get_str(g.json, 'name')) || '%'
    WHERE g.username = '${username}'
      AND hn.points IS NOT NULL
      AND json_get_str(g.json, 'language') IS NOT NULL
    ORDER BY hn.points DESC
    LIMIT 15
  `

  // Query 2: DEV.to reading list JOIN HackerNews
  const query2 = `
    SELECT
      '' AS repo,
      '' AS language,
      d.title AS devto_article,
      hn.title AS hn_story,
      hn.points,
      hn.url AS hn_url
    FROM devto.reading_list d
    JOIN hackernews.top_stories hn
      ON LOWER(hn.title) LIKE '%' || LOWER(d.tag_list) || '%'
    WHERE hn.points IS NOT NULL
    ORDER BY hn.points DESC
    LIMIT 10
  `

  const results: StarGapResult[] = []

  try {
    const raw1 = runQuery(query1)
    const rows1 = parseCoralTable(raw1, ['repo', 'language', 'devto_article', 'hn_story', 'points', 'hn_url'])
    rows1.forEach(r => results.push({
      repo: r.repo,
      language: r.language,
      devto_article: '',
      hn_story: r.hn_story,
      points: parseInt(r.points) || 0,
      hn_url: r.hn_url,
    }))
  } catch (e) { console.error('Query 1 failed:', e) }

  try {
    const raw2 = runQuery(query2)
    const rows2 = parseCoralTable(raw2, ['repo', 'language', 'devto_article', 'hn_story', 'points', 'hn_url'])
    rows2.forEach(r => results.push({
      repo: '',
      language: '',
      devto_article: r.devto_article,
      hn_story: r.hn_story,
      points: parseInt(r.points) || 0,
      hn_url: r.hn_url,
    }))
  } catch (e) { console.error('Query 2 failed:', e) }

  // Deduplicate by hn_story and sort by points
  const seen = new Set<string>()
  return results
    .filter(r => { const key = r.hn_story; if (seen.has(key)) return false; seen.add(key); return true })
    .sort((a, b) => b.points - a.points)
}

export const VISIBLE_QUERY = `-- GitHub Stars × HackerNews (via Coral cross-source JOIN)
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

-- DEV.to Reading List × HackerNews (via Coral cross-source JOIN)
SELECT
  d.title AS devto_article,
  hn.title AS hn_story,
  hn.points
FROM devto.reading_list d
JOIN hackernews.top_stories hn
  ON LOWER(hn.title) LIKE '%' || LOWER(d.tag_list) || '%'
WHERE hn.points IS NOT NULL
ORDER BY hn.points DESC;`
