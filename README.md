# ⚡ GEWI — Global Eco-War Impact Index

**Real-time Iran–US conflict economic impact tracker.**  
Live oil prices · Dubai real estate · Forex · News feed · GEWI Score (0–100)

🔗 **Live at:** [gewi-tracker-shksud.vercel.app](https://gewi-tracker-shksud.vercel.app)  
🐦 **Follow:** [@GEWIindex](https://twitter.com/GEWIindex)

---

## 🚀 Deploy in 5 Minutes (Vercel)

### 1. Clone & Install

```
git clone https://github.com/SHKSUD/gewi-tracker.git
cd gewi-tracker
npm install
```

### 2. Set Environment Variables

```
cp .env.example .env.local
# Edit .env.local and add your Gemini API key
```

Get your FREE Gemini Flash API key at: https://aistudio.google.com/app/apikey (no credit card needed, 1500 free requests/day)

### 3. Run Locally

```
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel

**Option A — Vercel Dashboard (recommended):**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo (`SHKSUD/gewi-tracker`)
3. Add environment variable: `GEMINI_API_KEY = your-key-here`
4. Deploy → your site is live in ~60 seconds

**Option B — Vercel CLI:**

```
npx vercel
# Follow prompts. Then set env var:
npx vercel env add GEMINI_API_KEY
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | **Yes** | Your Google Gemini API key for live oil prices + news |
| `NEXT_PUBLIC_SITE_URL` | Optional | Your deployed URL (for OG tags, defaults to your Vercel URL) |

---

## 📱 X (Twitter) Growth Strategy

### The Score is the Tweet

The **GEWI score** (0–100) is your hook. Every time it moves, tweet it:

```
🚨 GEWI just hit 89/100 — EXTREME STRESS

Global Eco-War Impact Index:
⚡ Oil: $103/bbl (+2.1%)  
🚢 Hormuz: CLOSED  
🏢 Dubai RE: −30%  
💱 Dollar surging

Track live → gewi-tracker-shksud.vercel.app #GEWI #OilPrice #IranWar
```

### Posting Schedule (for maximum reach)

* **07:00 UTC** — Daily GEWI Morning Brief (use Share button on site)
* **13:00 UTC** — Midday oil price update
* **18:00 UTC** — Market close summary
* **On GEWI spike (+3 pts)** — Immediate alert tweet

### Content Ideas

* Thread: "Why GEWI went from 72 → 87 in 48 hours"
* Thread: "The Strait of Hormuz explained — why it matters for you"
* Poll: "Where will oil be in 30 days? $100 / $120 / $150 / $200"
* Quote-tweet breaking news with your GEWI context
* Repost to LinkedIn for business audience

### Hashtags to Use

`#GEWI` `#OilPrice` `#IranWar` `#GlobalEconomy` `#Dubai` `#EconomicWarfare` `#Geopolitics` `#Commodities` `#Oil2026`

---

## 🏗 Architecture

```
gewi-tracker/
├── pages/
│   ├── index.js          # Main dashboard (React)
│   ├── _app.js           # Next.js app wrapper
│   ├── _document.js      # HTML head, fonts
│   └── api/
│       ├── market-data.js # Oil prices (Gemini search) + Forex
│       └── news.js        # Live news headlines (Gemini search)
├── styles/
│   └── globals.css        # All styles
├── package.json
├── next.config.js
├── vercel.json
└── .env.example
```

### Data Flow

```
Client (60s refresh) → /api/market-data
  → ExchangeRate-API (forex, free, no key)
  → Gemini API + web_search (oil prices)
  → Returns: { oil, forex, gewi, timestamp }

Client (5min refresh) → /api/news
  → Gemini API + web_search (latest headlines)
  → Returns: { news: [...], timestamp }
```

### GEWI Score Formula

```
Oil Disruption (0–25):  WTI > $110 = 25pts, > $100 = 22pts, > $90 = 17pts
Hormuz Closure (0–25):  Static 25 while Strait is closed
Conflict Intensity (0–25): 22 — active multi-front strikes
Economic Contagion (0–25): 15 — Dubai −30%, EM bonds worst
─────────────────────────────────────────────
Total: 84/100 = EXTREME STRESS
```

---

## 🛠 Tech Stack

* **Framework:** Next.js 14 (Pages Router)
* **Styling:** Custom CSS (no Tailwind — full control)
* **Fonts:** Bebas Neue + JetBrains Mono + Barlow (Google Fonts)
* **APIs:** Google Gemini (oil + news), ExchangeRate-API (forex, free)
* **Deployment:** Vercel (zero config)

---

## 📊 Data Sources

* Wikipedia: Economic impact of the 2026 Iran War
* Chatham House, Oxford Economics
* Reuters, Bloomberg, Al Jazeera, CNBC, The National
* Fitch Ratings, S&P Global Ratings
* Euronews conflict economic analysis
* ExchangeRate-API (real-time forex)
* Google Gemini web search (real-time oil + news)

---

## ⚠ Disclaimer

This tracker is for informational purposes only. Not financial or investment advice. Data is sourced from public news and financial APIs. The conflict situation is rapidly evolving — all figures may change within hours.

---

## 📄 License

MIT — free to fork, deploy, and adapt with attribution.

---

*GEWI™ — Global Eco-War Impact Index*  
*Built with Next.js + Google Gemini AI*
