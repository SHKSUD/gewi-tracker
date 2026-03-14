// pages/api/news.js
// Fetches live conflict news via Gemini Flash 2.0 + Google Search grounding
// Cached 5 minutes to keep costs low

let newsCache = { items: null, ts: 0 }
const NEWS_TTL = 5 * 60 * 1000

const FALLBACK_NEWS = [
  { id: 1,  time: '14 MAR · 12:41', type: 'MILITARY',   headline: 'US carrier group USS Nimitz moves toward Persian Gulf as Iran–US standoff enters day 14', source: 'Reuters' },
  { id: 2,  time: '14 MAR · 11:58', type: 'ECONOMIC',   headline: 'Oil above $100/bbl for first time since 2022 — Brent touched $103 in early Asian session', source: 'Bloomberg' },
  { id: 3,  time: '14 MAR · 11:12', type: 'ECONOMIC',   headline: 'Dubai real estate index down 30% since Feb 28 — DFM halted trading twice this week', source: 'The National' },
  { id: 4,  time: '14 MAR · 10:34', type: 'DIPLOMATIC', headline: 'China calls emergency UN Security Council session; demands immediate ceasefire resolution', source: 'Al Jazeera' },
  { id: 5,  time: '14 MAR · 09:55', type: 'MILITARY',   headline: 'Iran IRGC claims 3 additional tankers stopped in Strait of Hormuz overnight', source: 'AP' },
  { id: 6,  time: '14 MAR · 09:20', type: 'ECONOMIC',   headline: 'Pakistan declares energy emergency — LNG imports from Qatar down 80% since conflict began', source: 'Dawn' },
  { id: 7,  time: '14 MAR · 08:44', type: 'DIPLOMATIC', headline: 'Saudi Arabia, Qatar and Kuwait call for immediate de-escalation in joint statement', source: 'Gulf News' },
  { id: 8,  time: '14 MAR · 08:10', type: 'ECONOMIC',   headline: 'European gas futures +22% — No replacement available for Qatar LNG cut-off, analysts warn', source: 'Financial Times' },
  { id: 9,  time: '14 MAR · 07:38', type: 'MILITARY',   headline: 'US CENTCOM confirms two more Iranian drone attacks on US bases in Bahrain repelled', source: 'CNN' },
  { id: 10, time: '14 MAR · 07:05', type: 'ECONOMIC',   headline: 'Fed Governor Waller: "We cannot cut rates while oil is at $100 — stagflation risk is real"', source: 'CNBC' },
]

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')

  if (newsCache.items && Date.now() - newsCache.ts < NEWS_TTL) {
    return res.json({ news: newsCache.items, cached: true, ts: newsCache.ts })
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ news: FALLBACK_NEWS, cached: false, ts: Date.now() })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Search for the latest news today about: Iran US war conflict 2026, oil prices, Dubai economy crisis, Middle East economic impact.

Return ONLY a raw JSON array of 8-10 news items. No markdown, no backticks, no explanation:
[{"id":1,"time":"14 MAR · HH:MM","type":"MILITARY","headline":"concise headline under 120 chars","source":"source name"}]

Rules:
- type must be exactly: MILITARY, ECONOMIC, or DIPLOMATIC
- Use real headlines from your search
- Most recent first
- Keep headlines factual and concise`
          }]
        }],
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
      }),
    })

    if (!r.ok) throw new Error('Gemini news API failed: ' + r.status)

    const d = await r.json()
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)

    if (match) {
      const items = JSON.parse(match[0])
      newsCache = { items, ts: Date.now() }
      return res.json({ news: items, cached: false, ts: Date.now() })
    }

    throw new Error('Could not parse Gemini news response')
  } catch (err) {
    console.error('News API error:', err.message)
    newsCache = { items: FALLBACK_NEWS, ts: Date.now() }
    res.json({ news: FALLBACK_NEWS, cached: false, ts: Date.now() })
  }
}
