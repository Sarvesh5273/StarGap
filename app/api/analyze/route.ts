import { NextResponse } from 'next/server'
import { runStarGapQuery, getStarredCount, getDevtoCount, getHNCount, VISIBLE_QUERY } from '@/lib/coral'
import { generateInsight } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

export async function GET() {
  const username = process.env.GITHUB_USERNAME || 'Sarvesh5273'

  try {
    const [results, githubStars, devtoBookmarks, hnStories] = await Promise.all([
      Promise.resolve(runStarGapQuery(username)),
      Promise.resolve(getStarredCount(username)),
      Promise.resolve(getDevtoCount()),
      Promise.resolve(getHNCount()),
    ])

    const insight = await generateInsight(username, results)

    return NextResponse.json({
      username,
      stats: { githubStars, devtoBookmarks, hnStories },
      results,
      insight,
      query: VISIBLE_QUERY,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed. Check that Coral is running and all sources are configured.' }, { status: 500 })
  }
}
