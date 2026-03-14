// pages/api/market-data.js
// Fetches real-time oil + forex using Gemini Flash 2.0 + Google Search grounding
// Forex via free exchangerate-api (no key needed)

let cache = { data: null, ts: 0 }
const CACHE_TTL = 90 * 1000

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')

  if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return res.json({ ...cache.data, cached: true })
  }

  try {
    const [forexResult, oilResult] = await Promise.allSettled([
      fetchForex(),
      fetchOilGemini(),
    ])

    const forex = forexResult.status === 'fulfilled' ? forexResult.value : getFallbackForex()
    const oil   = oilResult.status   === 'fulfilled' ? oilResult.value   : getFallbackOil()

    const data = { oil, forex, gewi: calculateGEWI(oil), timestamp: Date.now(), cached: false }
    cache = { data, ts: Date.now() }
    res.json(data)
  } catch (err) {
    console.error('market-data error:', err)
    res.status(500).json({ error: err.message, ...getFallbacks() })
  }
}

async function fetchForex() {
  const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
  if (!r.ok) throw new Error('Forex API failed')
  const d = await r.json()
  return d.rates
}

async function fetchOilGemini() {
  if (!process.env.GEMINI_API_KEY) return getFallbackOil()

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{
          text: `Search for current live prices for WTI crude oil, Brent crude oil, natural gas Henry Hub, and gold spot price right now.
Return ONLY a raw JSON object, no markdown, no explanation:
{"wti":95.50,"wti_change":1.2,"wti_pct":1.28,"brent":99.80,"brent_change":0.9,"brent_pct":0.92,"natgas":3.45,"natgas_pct":0.5,"gold":2850,"gold_pct":0.3}`
        }]
      }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
    }),
  })

  if (!r.ok) throw new Error('Gemini API failed: ' + r.status)

  const d = await r.json()
  const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const match = text.replace(/```json|```/g, '').match(/\{[\s\S]*?\}/)
  if (!match) return getFallbackOil()
  return JSON.parse(match[0])
}

function calculateGEWI(oil) {
  const wti = oil?.wti || 95
  const oilScore = wti > 110 ? 25 : wti > 100 ? 22 : wti > 90 ? 17 : wti > 80 ? 10 : 5
  return Math.min(100, oilScore + 25 + 22 + 15)
}

function getFallbackOil() {
  return { wti: 98.5, wti_change: 1.4, wti_pct: 1.44, brent: 101.8, brent_change: 1.1, brent_pct: 1.09, natgas: 3.62, natgas_pct: 0.8, gold: 2871, gold_pct: 0.4 }
}

function getFallbackForex() {
  return { EUR: 0.923, GBP: 0.788, JPY: 149.5, CNY: 7.24, INR: 83.9, CAD: 1.362, AUD: 1.531, CHF: 0.894, BRL: 4.97, MXN: 17.1, KRW: 1338, SGD: 1.345, AED: 3.673, SAR: 3.751 }
}

function getFallbacks() {
  return { oil: getFallbackOil(), forex: getFallbackForex(), gewi: 84, timestamp: Date.now() }
}
