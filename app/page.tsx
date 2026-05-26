'use client'

import { useState } from 'react'

interface Result {
  repo: string
  language: string
  devto_article: string
  hn_story: string
  points: number
  hn_url: string
}

interface Stats {
  githubStars: number
  devtoBookmarks: number
  hnStories: number
}

interface AnalysisData {
  username: string
  stats: Stats
  results: Result[]
  insight: string
  query: string
  timestamp: string
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-500',
  Python: 'bg-green-500',
  Rust: 'bg-orange-600',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  'C++': 'bg-purple-500',
  Ruby: 'bg-red-400',
  Swift: 'bg-orange-400',
}

function Badge({ text, color }: { text: string; color?: string }) {
  return (
    <span className={`${color || 'bg-gray-600'} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}>
      {text}
    </span>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center bg-gray-900 border border-gray-700 rounded-xl px-5 py-3">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-gray-500 text-xs mt-0.5">{label}</span>
    </div>
  )
}

function ResultCard({ result }: { result: Result }) {
  const isGithub = !!result.repo
  const source = isGithub ? 'GitHub Star' : 'DEV.to Bookmark'
  const sourceColor = isGithub ? 'bg-gray-700' : 'bg-indigo-900'
  const langColor = LANG_COLORS[result.language] || 'bg-gray-600'

  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-xl p-5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge text={source} color={sourceColor} />
          {result.repo && <span className="font-mono text-white font-semibold">{result.repo}</span>}
          {result.language && <Badge text={result.language} color={langColor} />}
          {result.devto_article && (
            <span className="text-indigo-300 text-sm font-medium truncate max-w-[200px]">
              {result.devto_article}
            </span>
          )}
        </div>
        <span className="text-orange-400 font-bold text-sm shrink-0">▲ {result.points}</span>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">{result.hn_story}</p>
      {result.hn_url && (
        <a
          href={result.hn_url.startsWith('http') ? result.hn_url : `https://news.ycombinator.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400 hover:text-orange-300 text-xs underline transition-colors"
        >
          Read on HN →
        </a>
      )}
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showQuery, setShowQuery] = useState(false)
  const [error, setError] = useState('')

  async function runAnalysis() {
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch('/api/analyze')
      if (!res.ok) throw new Error('failed')
      setData(await res.json())
    } catch {
      setError('Analysis failed. Make sure Coral is installed and all sources are configured.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">⭐ StarGap</h1>
          <p className="text-gray-500 text-xs">GitHub × DEV.to × HackerNews — powered by Coral</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          <span className="text-gray-400 text-xs font-mono">coral connected</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero — shown before first run */}
        {!data && !loading && (
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3 leading-tight">
              Your saves are a graveyard.
            </h2>
            <p className="text-gray-400 text-base mb-2">
              You starred repos. You bookmarked articles. You meant to come back.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              StarGap finds which ones are blowing up on HackerNews right now.
            </p>
            <button
              onClick={runAnalysis}
              className="bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-bold px-8 py-3 rounded-xl text-base transition-all duration-150"
            >
              Run Analysis
            </button>
            <p className="text-gray-700 text-xs mt-4 font-mono">
              Queries GitHub + DEV.to + HackerNews via Coral SQL JOINs
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div className="text-5xl mb-5 animate-bounce">🪸</div>
            <p className="text-gray-300 font-medium">Running cross-source JOIN...</p>
            <p className="text-gray-600 text-xs font-mono mt-2">
              github.starred_repos ⋈ devto.reading_list ⋈ hackernews.top_stories
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-5">
            {/* Source stats */}
            <div className="flex justify-center gap-3">
              <StatPill label="GitHub Stars" value={data.stats.githubStars} color="text-yellow-400" />
              <StatPill label="DEV.to Saves" value={data.stats.devtoBookmarks} color="text-indigo-400" />
              <StatPill label="HN Stories" value={data.stats.hnStories} color="text-orange-400" />
            </div>

            {/* Match count + refresh */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Found <span className="text-orange-400 font-bold">{data.results.length}</span> overlaps
              </span>
              <button
                onClick={runAnalysis}
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Refresh ↻
              </button>
            </div>

            {/* AI Insight */}
            <div className="bg-gray-900 border border-orange-900/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">✦ Insight</span>
                <span className="text-gray-600 text-xs">via Gemini</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{data.insight}</p>
            </div>

            {/* SQL Query */}
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowQuery(v => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors bg-gray-900"
              >
                <span className="font-mono">🔍 View Coral SQL Queries</span>
                <span>{showQuery ? '▲' : '▼'}</span>
              </button>
              {showQuery && (
                <pre className="px-4 py-4 text-xs text-green-400 font-mono whitespace-pre-wrap bg-gray-950 border-t border-gray-800 overflow-x-auto">
                  {data.query}
                </pre>
              )}
            </div>

            {/* Cards */}
            {data.results.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-4xl mb-4">🌊</p>
                <p className="text-base">No overlap today.</p>
                <p className="text-sm mt-1">Star more repos or bookmark more articles, then check back.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.results.map((r, i) => (
                  <ResultCard key={i} result={r} />
                ))}
              </div>
            )}

            <p className="text-center text-gray-800 text-xs pt-2 font-mono">
              {new Date(data.timestamp).toLocaleString()} · Built with Coral
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
