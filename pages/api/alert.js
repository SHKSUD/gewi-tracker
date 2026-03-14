// pages/api/alert.js
// GEWI alert system — called by Vercel Cron every 2 hours
// Uses Gemini Flash for GEWI analysis, posts to X when thresholds crossed
// Cron config in vercel.json: "crons": [{"path":"/api/alert","schedule":"0 */2 * * *"}]

const THRESHOLDS = [80, 85, 90, 95]
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gewi.live'

let lastKnownGEWI = 87

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const marketRes = await fetch(`${baseUrl}/api/market-data`)
    const marketData = marketRes.ok ? await marketRes.json() : null

    const currentGEWI = marketData?.gewi || lastKnownGEWI
    const oil   = marketData?.oil
    const forex = marketData?.forex
    const results = { gewi: currentGEWI, alerts: [], daily: false }

    const now = new Date()
    const isAlertTime = THRESHOLDS.some(t => currentGEWI >= t && lastKnownGEWI < t)
    const isDailyTime  = now.getHours() === 7 && now.getMinutes() < 30

    // Optional: use Gemini to generate a richer alert summary
    let geminiSummary = null
    if ((isAlertTime || isDailyTime) && process.env.GEMINI_API_KEY) {
      geminiSummary = await getGeminiAlertSummary(currentGEWI, oil)
    }

    if (isAlertTime && process.env.TWITTER_BEARER_TOKEN) {
      const tweet = geminiSummary || buildAlertTweet(Math.round(currentGEWI), Math.round(lastKnownGEWI), oil)
      try {
        const twitterRes = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: tweet }),
        })
        results.alerts.push({ type: 'tweet', status: twitterRes.ok ? 'sent' : 'error', score: currentGEWI })
      } catch (err) {
        results.alerts.push({ type: 'tweet', status: 'error', error: err.message })
      }
    }

    if (isDailyTime && process.env.TWITTER_BEARER_TOKEN) {
      const tweet = buildDailyTweet(Math.round(currentGEWI), oil, forex)
      try {
        await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: tweet }),
        })
        results.daily = true
      } catch (err) {
        console.error('Daily tweet error:', err.message)
      }
    }

    lastKnownGEWI = currentGEWI
    return res.json({ success: true, ...results, timestamp: Date.now() })
  } catch (err) {
    console.error('Alert handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ── Gemini generates a richer, more human alert summary ──────────────────────
async function getGeminiAlertSummary(score, oil) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Write a compelling 280-character tweet announcing a GEWI score of ${score}/100 for the Iran-US conflict economic impact tracker. 
Current oil: $${oil?.wti?.toFixed(2) || '98.50'}/bbl. 
Include the score, a key fact, and the URL ${SITE_URL}.
End with #GEWI #IranWar #OilPrice
Be urgent and factual. No emojis. Just the tweet text, nothing else.`
          }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 128 }
      }),
    })
    const d = await r.json()
    return d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch {
    return null
  }
}

// ── Static tweet builders (fallback) ─────────────────────────────────────────
function buildAlertTweet(score, prevScore, oil) {
  const dir = score > prevScore ? 'up' : 'down'
  const moved = Math.abs(score - prevScore).toFixed(1)
  const sev = score >= 90 ? 'CATASTROPHIC' : score >= 85 ? 'EXTREME STRESS' : 'SEVERE CRISIS'
  return `GEWI ALERT: Score ${dir} ${moved} pts to ${score}/100 — ${sev}

Oil: $${oil?.wti?.toFixed(2) || '--'}/bbl
Hormuz: CLOSED Day 14+
Dubai RE: -30%

Live: ${SITE_URL}

#GEWI #GEWIAlert #OilPrice #IranWar #GlobalEconomy`
}

function buildDailyTweet(score, oil, forex) {
  const label = score >= 90 ? 'Catastrophic' : score >= 80 ? 'Extreme stress' : 'Severe crisis'
  const date  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `GEWI Daily Brief — ${date}

Score: ${score}/100 — ${label}
WTI: $${oil?.wti?.toFixed(2) || '--'}/bbl
Brent: $${oil?.brent?.toFixed(2) || '--'}/bbl
Hormuz: CLOSED -90%
Dubai RE: -30%

${SITE_URL}

#GEWI #GlobalEconomy #OilPrice #IranWar`
}

export { buildAlertTweet, buildDailyTweet }
