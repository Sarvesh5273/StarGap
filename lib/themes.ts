export const REPO_THEMES: Record<string, string> = {
  langgraph: 'AI Agents', crewai: 'AI Agents', autogen: 'AI Agents',
  langchain: 'AI Agents', ollama: 'Local AI', llama: 'Local AI',
  fastapi: 'Python Backend', redis: 'Databases', postgres: 'Databases',
  kubernetes: 'Cloud Native', docker: 'Cloud Native', tauri: 'Rust Apps',
  nextjs: 'Web Dev', react: 'Web Dev', supabase: 'Databases',
  whisper: 'AI Audio', pytorch: 'ML Training', transformers: 'ML Training',
}

export const HN_THEME_KEYWORDS: Record<string, string[]> = {
  'AI Agents': ['agent', 'autonomous', 'agentic', 'multi-agent'],
  'Local AI': ['local', 'offline', 'on-device', 'self-hosted'],
  'Python Backend': ['fastapi', 'python', 'async', 'pydantic'],
  'Databases': ['database', 'postgres', 'redis', 'sql', 'storage'],
  'Cloud Native': ['kubernetes', 'k8s', 'container', 'docker', 'helm'],
  'Rust Apps': ['rust', 'tauri', 'cargo', 'systems'],
  'Web Dev': ['next.js', 'react', 'frontend', 'typescript'],
  'ML Training': ['training', 'fine-tune', 'pytorch', 'model'],
  'AI Audio': ['whisper', 'speech', 'transcription', 'audio'],
}

export function getRepoTheme(repoName: string): string | null {
  return REPO_THEMES[repoName.toLowerCase()] || null
}

export function storyMatchesTheme(title: string, theme: string): boolean {
  const keywords = HN_THEME_KEYWORDS[theme] || []
  const lower = title.toLowerCase()
  return keywords.some(k => lower.includes(k))
}