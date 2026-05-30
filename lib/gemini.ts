import { StarGapResult } from './coral'

export async function generateInsight(
  username: string,
  results: StarGapResult[]
): Promise<string> {
  if (results.length === 0) {
    return "No meaningful overlap was detected today. The technologies you're tracking are not receiving significant Hacker News attention right now."
  }

  const repos = results
    .filter(r => r.repo)
    .map(r => `${r.repo} (${r.language})`)
    .slice(0, 8)

  const articles = results
    .filter(r => r.devto_article)
    .map(r => r.devto_article)
    .slice(0, 5)

  const hnStories = results
    .map(r => `${r.hn_story} (${r.points} points)`)
    .slice(0, 8)

  const prompt = `
You are analyzing developer behavior.
A developer has repeatedly saved content across multiple platforms.

GitHub Stars:
${repos.join('\n')}

DEV.to Bookmarks:
${articles.join('\n')}

Matching Hacker News Stories:
${hnStories.join('\n')}

Your task:
1. Identify recurring technology themes.
2. Explain what interests this developer appears to have.
3. Point out any pattern of repeated interest.
4. Give exactly ONE action they should take this week.

Rules:
- Maximum 80 words.
- No motivational language.
- No generic advice.
- Sound like an analyst.
- Focus on patterns, not individual links.
`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    if (!res.ok) {
      console.error('Gemini error:', res.status, await res.text())
      return 'Signal analysis temporarily unavailable.'
    }

    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Analysis complete.'
  } catch (e) {
    console.error('Gemini fetch failed:', e)
    return 'Unable to generate insight.'
  }
}