import { StarGapResult } from './coral'

export async function generateInsight(
  username: string,
  results: StarGapResult[]
): Promise<string> {
  if (results.length === 0) {
    return "No overlap found between your saved content and today's HN front page. Your stack is flying under the radar — or the moment hasn't arrived yet."
  }

  const githubMatches = results.filter(r => r.repo).slice(0, 3)
  const devtoMatches = results.filter(r => r.devto_article).slice(0, 2)

  const summary = [
    ...githubMatches.map(r => `- GitHub star "${r.repo}" (${r.language}) → HN: "${r.hn_story}" (${r.points} pts)`),
    ...devtoMatches.map(r => `- DEV.to bookmark "${r.devto_article}" → HN: "${r.hn_story}" (${r.points} pts)`),
  ].join('\n')

  const prompt = `Developer ${username} saved these things and they are trending on HN today:\n\n${summary}\n\nGive 2-3 sentences of sharp, actionable insight. Tell them exactly what to do with this information today. Be direct. No fluff.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Analysis complete.'
}
