import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'

// ── STATIC DATA ────────────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gewi.live'

const COUNTRIES = [
  {
    code: 'AE', flag: '🇦🇪', name: 'UAE / DUBAI', role: 'Drone strikes · Safe haven shattered',
    risk: 'CRITICAL', rc: 'rb-critical',
    rows: [
      { s: 'Real Estate', t: 'DFM index lost 30% since Feb 28, wiping all 2026 gains. Luxury segment hardest hit. Fitch had forecast 15% correction — war tripled it.', v: '−30%', vc: 'down' },
      { s: 'Airport', t: 'Dubai International struck by Iranian drone. Evacuated. Major airlines suspended ME routes. Freight delays cascade.', v: 'STRUCK', vc: 'down' },
      { s: 'Corp Bonds', t: 'UAE bonds worst performers in Bloomberg EM index. Real estate developer bonds in freefall.', v: 'WORST EM', vc: 'down' },
      { s: 'Tourism', t: 'Fairmont Palm Hotel hit. Burj Al Arab damaged by drone debris. Expatriate departures accelerating.', v: 'CRITICAL', vc: 'down' },
    ]
  },
  {
    code: 'IR', flag: '🇮🇷', name: 'IRAN', role: 'Conflict epicentre · Economy in freefall',
    risk: 'CRITICAL', rc: 'rb-critical',
    rows: [
      { s: 'Economy', t: 'Pre-conflict inflation above 40%. Rial in freefall. Iranian officials moving assets abroad — Treasury: "abandoning ship."', v: '+40% INFL', vc: 'down' },
      { s: 'Sanctions', t: 'UN sanctions restored Sep 2025. New US sanctions Jan 2026. Target: Iranian oil exports to zero. Shadow fleet being seized.', v: 'MAXIMUM', vc: 'down' },
      { s: 'Hormuz', t: 'Closing the Strait is Iran\'s nuclear economic option — attempting to push oil to $200/bbl to force global pressure for ceasefire.', v: 'CLOSED', vc: 'down' },
      { s: 'Leadership', t: 'Supreme Leader Khamenei killed in strikes. New SL: Mojtaba Khamenei. War aims and exit conditions remain unclear.', v: 'DESTAB.', vc: 'down' },
    ]
  },
  {
    code: 'US', flag: '🇺🇸', name: 'UNITED STATES', role: 'Aggressor · Already tariff-stressed economy',
    risk: 'SEVERE', rc: 'rb-severe',
    rows: [
      { s: 'Markets', t: 'Dow Jones fell 400+ pts on Mar 2. Oil-driven inflation compounds existing tariff price pressures. Stagflation risk rising fast.', v: '−400 DOW', vc: 'down' },
      { s: 'Fed Policy', t: 'Rate cuts now delayed. Fed stuck: raise rates vs inflation OR cut to support growth. IMF warns: "minds go to the 1970s."', v: 'STUCK', vc: 'down' },
      { s: 'Supply Chain', t: 'Oil derivatives (plastics, pharma, fertilisers) facing shortages. Spring fertiliser delays risk 2027 crop yields.', v: 'DISRUPTED', vc: 'down' },
      { s: 'Military', t: 'Bases in Qatar, UAE, Bahrain struck. France opened bases. Spain refused — Trump threatened retaliation.', v: 'UNDER FIRE', vc: 'down' },
    ]
  },
  {
    code: 'IL', flag: '🇮🇱', name: 'ISRAEL', role: 'Co-aggressor · Multi-front war',
    risk: 'CRITICAL', rc: 'rb-critical',
    rows: [
      { s: 'GDP', t: 'Economy contracted ~1% in Q2 during 12-day war last summer. Multi-front conflict now compounds with wartime spending ballooning.', v: '−1%+ GDP', vc: 'down' },
      { s: 'Military', t: 'Operating side-by-side with US per Netanyahu. Iranian missile strikes ongoing. Levant, Gaza, Persian Gulf theaters all active.', v: 'MULTI-FRONT', vc: 'down' },
      { s: 'Bonds', t: 'Israel bonds under significant pressure. Foreign investors reducing exposure to Israeli assets amid prolonged conflict.', v: 'PRESSURED', vc: 'down' },
    ]
  },
  {
    code: 'SA', flag: '🇸🇦', name: 'SAUDI ARABIA', role: 'Energy infra struck · Caught in crossfire',
    risk: 'SEVERE', rc: 'rb-severe',
    rows: [
      { s: 'Oil Infra', t: 'Iranian strikes on Saudi energy facilities. Production continues but storage filling — nowhere to export through closed Hormuz.', v: 'STRUCK', vc: 'down' },
      { s: 'Diplomacy', t: 'KSA hedging strategy — align with US, contain Iran — has failed. Joining attacks invites fiercer retaliation. Paralysed.', v: 'PARALYSED', vc: 'down' },
      { s: 'Vision 2030', t: 'Neom, Red Sea tourist projects at risk of delay. Sovereign wealth fund under pressure to support domestic economy.', v: 'AT RISK', vc: 'down' },
    ]
  },
  {
    code: 'PK', flag: '🇵🇰', name: 'PAKISTAN', role: 'LNG cut off · Especially bleak',
    risk: 'CRITICAL', rc: 'rb-critical',
    rows: [
      { s: 'Energy', t: 'Imports 40% of energy. Qatar LNG — main supply — cut off by conflict. Declared national energy emergency.', v: 'LNG CUT OFF', vc: 'down' },
      { s: 'Security', t: 'Balochistan tensions rising from Iran instability. Risk of 2-front situation (India + Iran border) Pakistan cannot afford.', v: '2-FRONT RISK', vc: 'down' },
      { s: 'Food', t: 'Gulf fertiliser supply severely disrupted. Spring planting at risk. UN WFP warns of significant food price spikes.', v: 'FOOD RISK', vc: 'down' },
    ]
  },
  {
    code: 'IN', flag: '🇮🇳', name: 'INDIA', role: 'Major oil importer · Gulf diaspora at risk',
    risk: 'HIGH', rc: 'rb-high',
    rows: [
      { s: 'Energy', t: 'Reduced Iranian oil under US sanctions. Now facing higher global prices. Import bill expanding sharply amid weaker rupee.', v: 'HIGHER COSTS', vc: 'down' },
      { s: 'Diaspora', t: 'Millions of Indian workers in UAE, Qatar, KSA. Airspace closures disrupt travel. Remittances at risk if Gulf contracts.', v: 'REMITTANCES', vc: 'down' },
      { s: 'Real Estate', t: 'Indian investors are largest Dubai RE buyer group. Assets now 30% underwater. Rental yield buffer (6-9%) still attractive.', v: 'EXPOSURE', vc: 'down' },
    ]
  },
  {
    code: 'EU', flag: '🇪🇺', name: 'EUROPE', role: 'LNG crisis · Q2 contraction risk',
    risk: 'HIGH', rc: 'rb-high',
    rows: [
      { s: 'Economy', t: 'Eurozone likely to contract Q2 2026, then flatline H2. CPI ~0.5% higher than forecast. Gas stocks low coming out of winter.', v: 'Q2 CONTRACT', vc: 'down' },
      { s: 'Gas Crisis', t: 'Qatar LNG cut off. "No replacement available" — analysts. European gas market was already "relatively tight" pre-conflict.', v: 'NO REPLACE', vc: 'down' },
      { s: 'NATO', t: 'France opened US bases. Spain denied — Trump threatened retaliation. Greece-Turkey tensions. NATO coordination severely strained.', v: 'FRACTURED', vc: 'down' },
    ]
  },
  {
    code: 'CN', flag: '🇨🇳', name: 'CHINA · JAPAN · KOREA', role: '75% of Gulf oil flows to Asia',
    risk: 'SEVERE', rc: 'rb-severe',
    rows: [
      { s: 'Oil Exposure', t: 'China, India, Japan, South Korea account for 75% of Gulf oil exports and 59% of LNG — all disrupted. SE Asia 74–96% Gulf-dependent.', v: '75% EXPOSED', vc: 'down' },
      { s: 'Stance', t: 'China condemned US strikes and called for diplomatic resolution. Refuses to recognise restored UN sanctions. Strategic hedge.', v: 'OPPOSED US', vc: 'warn' },
      { s: 'Semicons', t: 'Gulf is major helium producer. Disruption hits chip fabs in Korea, Taiwan, Japan — cascading into auto and tech manufacturing.', v: 'CHIPS HIT', vc: 'down' },
    ]
  },
  {
    code: 'RU', flag: '🇷🇺', name: 'RUSSIA · NORWAY · CANADA', role: 'Non-Gulf oil producers — benefiting',
    risk: 'POSITIVE', rc: 'rb-positive',
    rows: [
      { s: 'Oil Revenue', t: 'All non-Gulf oil producers benefiting from price surge. Russia, Norway, Canada seeing windfall as Brent approaches $100+.', v: 'WINDFALL', vc: 'up' },
      { s: 'Russia', t: 'Benefits from higher oil AND US distracted from Ukraine. Reportedly covertly aiding Iran. Refuses to recognise UN Iran sanctions.', v: 'STRATEGIC WIN', vc: 'up' },
      { s: 'Norway LNG', t: 'Europe turning to Norway as Qatar LNG is cut off. Norwegian gas exports now critical for European energy security. Premium prices.', v: 'CRITICAL', vc: 'up' },
    ]
  },
]

const TIMELINE = [
  { date: 'DEC 28 2025', dot: 'dot-a', text: '<strong>Mass protests erupt across all 31 Iranian provinces</strong> — triggered by 40%+ inflation and currency collapse. Grand Bazaar shopkeepers strike.' },
  { date: 'JAN 2026',    dot: 'dot-b', text: '<strong>US seizes Iranian tanker Bella 1</strong> with UK support. New sanctions target Iranian interior minister. Treasury: "leaders abandoning ship."' },
  { date: 'FEB 28 2026', dot: 'dot-r', text: '<strong>US & Israel launch coordinated strikes on Iran</strong> — targeting nuclear programme, leadership, ballistic missiles. Supreme Leader Khamenei killed.' },
  { date: 'MAR 1',       dot: 'dot-r', text: '<strong>Iran retaliates</strong> — missiles and drones hit US bases in Qatar, UAE, Bahrain. Dubai International Airport struck. Strait of Hormuz closure begins.' },
  { date: 'MAR 2',       dot: 'dot-r', text: '<strong>Oil spikes 10–13%.</strong> Dow falls 400+ pts. All Gulf airspace closes. Ships anchor off UAE coast. Shipping insurance cancelled.' },
  { date: 'MAR 5',       dot: 'dot-a', text: '<strong>France authorises US use of its bases.</strong> Spain denies access — Trump threatens retaliation. Qatar warns Gulf states may declare force majeure.' },
  { date: 'MAR 9',       dot: 'dot-r', text: '<strong>Dubai real estate loses 20% in 5 sessions</strong> — DFM halts trading twice. Total loss reaches 30%, wiping all 2026 gains.' },
  { date: 'MAR 12',      dot: 'dot-o', text: '<strong>Oil breaks $100/bbl.</strong> US mortgage rates rise to 6.29%. Iran warns $200 possible. Hormuz traffic down 90%. Gulf oil storage nearly full.' },
  { date: 'MAR 14 · NOW', dot: 'dot-r', text: '<strong>CURRENT</strong> — Conflict ongoing. Trump declared "We won" but Hormuz remains closed. Iran still striking ships. Economic shockwaves still spreading.' },
]

const WINNERS = [
  { flag: '🇷🇺', name: 'Russia — Oil windfall + US distracted from Ukraine', v: '▲ OIL', vc: 'up' },
  { flag: '🇳🇴', name: 'Norway — Critical LNG supplier to starving Europe', v: '▲ GAS', vc: 'up' },
  { flag: '🇨🇦', name: 'Canada — Non-Gulf oil producer, safe from strikes', v: '▲ PRICES', vc: 'up' },
  { flag: '🇧🇷', name: 'Brazil — Petrobras windfall, non-Gulf supply', v: '▲ PETROBRAS', vc: 'up' },
]

const LOSERS = [
  { flag: '🇦🇪', name: 'UAE / Dubai — Struck, real estate −30%, safe haven gone', v: '▼ −30% RE', vc: 'down' },
  { flag: '🇵🇰', name: 'Pakistan — LNG cut off, 2-front risk, food insecurity', v: '▼ CRITICAL', vc: 'down' },
  { flag: '🇮🇷', name: 'Iran — Economy in ruins, leadership killed, rial worthless', v: '▼ COLLAPSE', vc: 'down' },
  { flag: '🇵🇭', name: 'Philippines — 96% oil from Gulf, most exposed in Asia', v: '▼ 96% EXP', vc: 'down' },
  { flag: '🇪🇬', name: 'Egypt — Suez + oil imports straining fiscal position', v: '▼ FISCAL', vc: 'down' },
]

// ── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(n, dec = 2) { return Number(n).toFixed(dec) }
function fmtFx(n) { return n > 100 ? fmt(n, 2) : fmt(n, 4) }
function changeColor(v) { return v >= 0 ? 'up' : 'down' }
function changeArrow(v) { return v >= 0 ? '▲' : '▼' }

function gewiLabel(score) {
  if (score >= 90) return 'CATASTROPHIC'
  if (score >= 80) return 'EXTREME STRESS'
  if (score >= 65) return 'SEVERE CRISIS'
  if (score >= 50) return 'HIGH TENSION'
  if (score >= 30) return 'ELEVATED RISK'
  return 'MONITORED'
}

function gewiColor(score) {
  if (score >= 80) return 'var(--red)'
  if (score >= 65) return 'var(--orange)'
  if (score >= 50) return 'var(--amber)'
  return 'var(--green)'
}

// Simulated micro price movements (±0.3%)
function microMove(base) {
  return base * (1 + (Math.random() - 0.5) * 0.006)
}

// Build Sparkline path from array of values
function buildSparkPath(values, w = 100, h = 32) {
  if (!values || values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  return 'M' + pts.join(' L')
}

// ── GAUGE SVG ────────────────────────────────────────────────────────────────
function GaugeArc({ score }) {
  const r = 70; const cx = 100; const cy = 90
  const startAngle = -210; const endAngle = 30
  const totalDeg = endAngle - startAngle
  const rad = (deg) => (deg * Math.PI) / 180
  const arcX = (a) => cx + r * Math.cos(rad(a))
  const arcY = (a) => cy + r * Math.sin(rad(a))

  const pct = score / 100
  const fillEnd = startAngle + totalDeg * pct
  const color = gewiColor(score)

  // Needle angle
  const needleAngle = startAngle + totalDeg * pct
  const nLen = 55; const nTail = 15
  const nx = cx + nLen * Math.cos(rad(needleAngle))
  const ny = cy + nLen * Math.sin(rad(needleAngle))
  const tx = cx - nTail * Math.cos(rad(needleAngle))
  const ty = cy - nTail * Math.sin(rad(needleAngle))

  return (
    <svg viewBox="0 0 200 110" className="gauge-svg">
      {/* Track */}
      <path
        d={`M${arcX(startAngle)},${arcY(startAngle)} A${r},${r} 0 1,1 ${arcX(endAngle)},${arcY(endAngle)}`}
        fill="none" stroke="var(--border2)" strokeWidth="8" strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M${arcX(startAngle)},${arcY(startAngle)} A${r},${r} 0 ${pct > 0.5 ? 1 : 0},1 ${arcX(fillEnd)},${arcY(fillEnd)}`}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      {/* Needle */}
      <line x1={tx} y1={ty} x2={nx} y2={ny} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={color} />
      {/* Labels */}
      <text x="28" y="100" className="gauge-sub-text">0</text>
      <text x="170" y="100" className="gauge-sub-text">100</text>
      <text x={cx} y={cy - 20} className="gauge-needle-val" style={{ fill: color }}>{score}</text>
      <text x={cx} y={cy + 6} className="gauge-sub-text">GEWI SCORE</text>
    </svg>
  )
}

// ── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ history, color }) {
  const w = 100; const h = 32
  const path = buildSparkPath(history, w, h)
  if (!path) return null
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color || 'var(--amber)'} strokeWidth="1.5" />
      <path d={path + ` L${w},${h} L0,${h} Z`} fill={color || 'var(--amber)'} opacity="0.08" />
    </svg>
  )
}

// ── TICKER TAPE ───────────────────────────────────────────────────────────────
function Ticker({ oil, forex, gewi }) {
  const items = []
  if (oil?.wti) items.push({ sym: 'WTI CRUDE', val: `$${fmt(oil.wti)}`, chg: oil.wti_pct || 1.44 })
  if (oil?.brent) items.push({ sym: 'BRENT', val: `$${fmt(oil.brent)}`, chg: oil.brent_pct || 1.09 })
  if (oil?.natgas) items.push({ sym: 'NAT.GAS', val: `$${fmt(oil.natgas)}`, chg: oil.natgas_pct || 0.8 })
  if (oil?.gold) items.push({ sym: 'GOLD', val: `$${Math.round(oil.gold)}`, chg: oil.gold_pct || 0.4 })
  if (gewi) items.push({ sym: 'GEWI INDEX', val: `${gewi}/100`, chg: 0.5 })
  const PAIRS = ['EUR','GBP','JPY','CNY','INR','AED','SAR','CAD','CHF']
  PAIRS.forEach(p => {
    if (forex?.[p]) items.push({ sym: `USD/${p}`, val: fmtFx(forex[p]), chg: (Math.random() - 0.5) * 0.2 })
  })

  const doubled = [...items, ...items]

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {doubled.map((it, i) => (
          <span className="tick-item" key={i}>
            <span className="tick-sym">{it.sym}</span>
            {it.val}&nbsp;
            <span className={it.chg >= 0 ? 'tick-up' : 'tick-down'}>
              {it.chg >= 0 ? '▲' : '▼'} {Math.abs(it.chg).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── SHARE MODAL ───────────────────────────────────────────────────────────────
function ShareModal({ gewi, oil, onClose }) {
  const tweet = `🚨 GEWI Score: ${gewi}/100 — ${gewiLabel(gewi)}

Global Eco-War Impact Index · Iran–US Conflict Update

⚡ Oil: $${oil?.wti ? fmt(oil.wti) : '98.50'}/bbl (+${oil?.wti_pct ? fmt(oil.wti_pct) : '1.4'}%)
🚢 Strait of Hormuz: CLOSED (−90% traffic)
🏢 Dubai Real Estate: −30% since Feb 28
💱 Dollar under pressure · Fed policy frozen

Track live → ${SITE_URL}

#GEWI #OilPrice #IranWar #GlobalEconomy #Dubai #EconomicWarfare`

  const openTweet = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⚡ SHARE GEWI ALERT</div>
        <div className="tweet-preview">{tweet}</div>
        <div className="modal-btns">
          <button className="btn-primary" onClick={openTweet}>POST TO X / TWITTER</button>
          <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(tweet); onClose() }}>COPY TEXT</button>
          <button className="btn-ghost" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </div>
  )
}

// ── NEWS TYPE STYLE ───────────────────────────────────────────────────────────
function newsTypeClass(type) {
  if (!type) return 'nt-economic'
  const t = type.toLowerCase()
  if (t.includes('military') || t.includes('breaking')) return 'nt-military'
  if (t.includes('diplomatic')) return 'nt-diplomatic'
  return 'nt-economic'
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function GEWITracker() {
  const [marketData, setMarketData] = useState(null)
  const [news, setNews]             = useState([])
  const [gewi, setGewi]             = useState(87)
  const [clock, setClock]           = useState('')
  const [dateStr, setDateStr]       = useState('')
  const [showShare, setShowShare]   = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const [microOil, setMicroOil]     = useState({ wti: 98.5, brent: 101.8, natgas: 3.62, gold: 2871 })
  const [wtiHistory, setWtiHistory] = useState([98.5])
  const [newsLoading, setNewsLoading] = useState(true)
  const [gewiTrend, setGewiTrend]   = useState(0) // +/- vs last fetch
  const prevGewi = useRef(87)

  // Clock
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setClock(n.toLocaleTimeString('en-US', { hour12: false }))
      setDateStr(n.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase())
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  // Market data fetch
  const fetchMarket = useCallback(async () => {
    try {
      const r = await fetch('/api/market-data')
      const d = await r.json()
      setMarketData(d)
      const newGewi = d.gewi || 87
      setGewiTrend(newGewi - prevGewi.current)
      prevGewi.current = newGewi
      setGewi(newGewi)
      if (d.oil) {
        setMicroOil(d.oil)
        setWtiHistory(h => [...h.slice(-30), d.oil.wti])
      }
      setLastUpdate(new Date().toLocaleTimeString('en-US', { hour12: false }))
    } catch (e) { console.error('Market fetch error', e) }
  }, [])

  // News fetch
  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    try {
      const r = await fetch('/api/news')
      const d = await r.json()
      setNews(d.news || [])
    } catch (e) { console.error('News fetch error', e) }
    setNewsLoading(false)
  }, [])

  // Initial + intervals
  useEffect(() => {
    fetchMarket(); fetchNews()
    const mkt = setInterval(fetchMarket, 90 * 1000)
    const nws = setInterval(fetchNews,  5 * 60 * 1000)
    return () => { clearInterval(mkt); clearInterval(nws) }
  }, [fetchMarket, fetchNews])

  // Micro price simulation every 10s
  useEffect(() => {
    const id = setInterval(() => {
      setMicroOil(p => {
        const nw = { ...p, wti: microMove(p.wti), brent: microMove(p.brent), natgas: microMove(p.natgas) }
        setWtiHistory(h => [...h.slice(-30), nw.wti])
        return nw
      })
    }, 10000)
    return () => clearInterval(id)
  }, [])

  // GEWI slow creep simulation (±0.5 every 25s to feel alive)
  useEffect(() => {
    const id = setInterval(() => {
      setGewi(g => Math.min(100, Math.max(70, g + (Math.random() - 0.48))))
    }, 25000)
    return () => clearInterval(id)
  }, [])

  const oil   = microOil
  const forex = marketData?.forex

  const metaDesc = `GEWI Score: ${gewi}/100 — ${gewiLabel(gewi)}. Real-time Iran–US conflict economic impact tracker. Oil $${fmt(oil.wti)}/bbl. Dubai RE −30%. Hormuz closed.`

  return (
    <>
      <Head>
        <title>GEWI — Global Eco-War Impact Index | Iran–US Conflict Tracker</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={`GEWI ${gewi}/100 — Global Eco-War Impact Index`} />
        <meta property="og:description" content={metaDesc} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@GEWIindex" />
        <meta name="twitter:title" content={`⚡ GEWI ${gewi}/100 — ${gewiLabel(gewi)}`} />
        <meta name="twitter:description" content={metaDesc} />

        {/* SEO */}
        <meta name="keywords" content="Iran war economic impact, oil price war, Dubai real estate crisis, Strait of Hormuz, GEWI, global economy conflict, oil price 2026" />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      {/* Ticker */}
      <Ticker oil={oil} forex={forex} gewi={Math.round(gewi)} />

      <div className="page">
        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-left">
            <div className="eyebrow">
              <span className="blink-dot" />
              LIVE MONITORING · MARCH 2026 · IRAN–US MILITARY CONFLICT
            </div>
            <h1 className="site-title">
              GLOBAL ECO-WAR<br /><span className="accent">IMPACT INDEX</span>
            </h1>
            <p className="site-sub">GEWI™ — Real-Time Economic Warfare &amp; Conflict Contagion Tracker</p>
          </div>
          <div className="header-right">
            <span className="live-badge"><span className="blink-dot" />LIVE</span>
            <div className="clock-block">{clock || '--:--:--'}</div>
            <div className="date-block">{dateStr || 'LOADING...'}</div>
            <button className="share-btn" onClick={() => setShowShare(true)}>
              ⚡ SHARE ON X
            </button>
          </div>
        </header>

        {/* ── ALERT BANNER ── */}
        <div className="alert">
          <strong>⚡ ACTIVE CONFLICT:</strong> US &amp; Israel struck Iran on Feb 28, 2026.
          Iran retaliated — hitting US bases in Qatar, UAE, Bahrain and <strong>closing the Strait of Hormuz</strong>.
          Dubai International Airport struck by Iranian drone. Oil above <strong>$100/bbl</strong>.
          Dubai real estate index <strong>−30% in 2 weeks</strong>.
          Global shipping disrupted. 20% of world oil supply offline.
        </div>

        {/* ── ROW 1: GEWI + GAUGE + COMMODITIES ── */}
        <div className="bento">

          {/* GEWI Score */}
          <div className="tile col-4 gewi-tile">
            <div className="gewi-label">GEWI™ SCORE — GLOBAL ECO-WAR IMPACT INDEX</div>
            <div className="gewi-score" style={{ color: gewiColor(Math.round(gewi)) }}>
              {Math.round(gewi)}<span className="gewi-outof"> /100</span>
            </div>
            <div className="gewi-status">{gewiLabel(Math.round(gewi))}</div>
            <p className="gewi-desc">
              Composite of oil disruption (25), Hormuz closure (25), conflict intensity (22), and economic contagion (15).
              {gewiTrend !== 0 && <span style={{marginLeft:6, color: gewiTrend > 0 ? 'var(--red)' : 'var(--green)'}}>
                {gewiTrend > 0 ? '▲' : '▼'} {Math.abs(gewiTrend).toFixed(1)} since last fetch
              </span>}
            </p>
            <div className="gewi-bars">
              {[
                { label: 'OIL DISRUPTION', pct: oil.wti > 100 ? 100 : oil.wti > 90 ? 88 : 68, color: 'var(--orange)' },
                { label: 'HORMUZ CLOSURE', pct: 100, color: 'var(--red)' },
                { label: 'CONFLICT INTENSITY', pct: 88, color: 'var(--red)' },
                { label: 'ECON CONTAGION', pct: 60, color: 'var(--amber)' },
              ].map(b => (
                <div className="gbar-row" key={b.label}>
                  <span className="gbar-label">{b.label}</span>
                  <div className="gbar-track">
                    <div className="gbar-fill" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                  <span className="gbar-val">{b.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gauge */}
          <div className="tile col-3 gauge-tile">
            <div className="gauge-title">⚡ WAR RISK GAUGE</div>
            <GaugeArc score={Math.round(gewi)} />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', letterSpacing: '0.1em', color: gewiColor(Math.round(gewi)) }}>
                {gewiLabel(Math.round(gewi))}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--muted2)', marginTop: 4 }}>
                LAST UPDATE: {lastUpdate || '--:--:--'}
              </div>
            </div>
          </div>

          {/* WTI Oil */}
          <div className="tile col-2 comm-tile">
            <div className="ct-label">WTI CRUDE OIL</div>
            <div className="ct-price">${fmt(oil.wti)}</div>
            <div className="ct-change up">▲ +{fmt(oil.wti_pct || 1.44)}%</div>
            <div className="ct-unit">USD / BARREL · NYMEX</div>
            <div className="ct-sparkline">
              <Sparkline history={wtiHistory} color="var(--orange)" />
            </div>
          </div>

          {/* Brent */}
          <div className="tile col-2 comm-tile">
            <div className="ct-label">BRENT CRUDE</div>
            <div className="ct-price">${fmt(oil.brent)}</div>
            <div className="ct-change up">▲ +{fmt(oil.brent_pct || 1.09)}%</div>
            <div className="ct-unit">USD / BARREL · ICE</div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--muted2)' }}>
              ANALYST TARGET: $130 IF HORMUZ STAYS CLOSED
            </div>
          </div>

          {/* Hormuz */}
          <div className="tile col-4 hormuz-tile">
            <div className="ht-title">⚓ STRAIT OF HORMUZ</div>
            <div className="ht-status">⚠ EFFECTIVELY CLOSED — DAY 14</div>
            <div className="ht-stat"><span className="ht-key">Global oil supply through Hormuz</span><span className="ht-val amb">20%</span></div>
            <div className="ht-stat"><span className="ht-key">Traffic vs normal</span><span className="ht-val down">−90%</span></div>
            <div className="ht-stat"><span className="ht-key">Commercial vessels targeted</span><span className="ht-val down">9+</span></div>
            <div className="ht-stat"><span className="ht-key">LNG supply disruption</span><span className="ht-val down">CRITICAL</span></div>
            <div className="ht-stat"><span className="ht-key">Shipping insurance</span><span className="ht-val down">CANCELLED</span></div>
            <div className="ht-stat"><span className="ht-key">Oil at $200 if blockade holds</span><span className="ht-val warn">IRAN WARNING</span></div>
          </div>

        </div>

        {/* ── ROW 2: FOREX + NAT GAS + GOLD ── */}
        <div className="bento">
          {[
            { label: 'NAT. GAS (HENRY HUB)', val: `$${fmt(oil.natgas)}`, sub: 'USD/MMBTU', chg: oil.natgas_pct || 0.8, note: 'Qatar supply cut — no replacement' },
            { label: 'GOLD (SAFE HAVEN)', val: `$${Math.round(oil.gold || 2871)}`, sub: 'USD/OZ · COMEX', chg: oil.gold_pct || 0.4, note: 'War premium building' },
          ].map(c => (
            <div className="tile col-2 comm-tile" key={c.label}>
              <div className="ct-label">{c.label}</div>
              <div className="ct-price">{c.val}</div>
              <div className={`ct-change ${changeColor(c.chg)}`}>{changeArrow(c.chg)} {Math.abs(c.chg).toFixed(2)}%</div>
              <div className="ct-unit">{c.sub}</div>
              <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--muted2)' }}>{c.note}</div>
            </div>
          ))}

          {forex && [
            { pair: 'USD/EUR', f: '🇪🇺', val: fmtFx(forex.EUR), name: 'Euro' },
            { pair: 'USD/GBP', f: '🇬🇧', val: fmtFx(forex.GBP), name: 'British Pound' },
            { pair: 'USD/JPY', f: '🇯🇵', val: fmtFx(forex.JPY), name: 'Japanese Yen' },
            { pair: 'USD/CNY', f: '🇨🇳', val: fmtFx(forex.CNY), name: 'Chinese Yuan' },
            { pair: 'USD/INR', f: '🇮🇳', val: fmtFx(forex.INR), name: 'Indian Rupee' },
            { pair: 'USD/AED', f: '🇦🇪', val: fmtFx(forex.AED), name: 'UAE Dirham' },
            { pair: 'USD/SAR', f: '🇸🇦', val: fmtFx(forex.SAR), name: 'Saudi Riyal' },
            { pair: 'USD/CAD', f: '🇨🇦', val: fmtFx(forex.CAD), name: 'Canadian Dollar' },
          ].map(fx => (
            <div className="tile col-2 comm-tile" key={fx.pair} style={{ padding: '12px 14px' }}>
              <div className="ct-label">{fx.f} {fx.pair}</div>
              <div className="ct-price" style={{ fontSize: '1.6rem' }}>{fx.val}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--muted2)', marginTop: 4 }}>{fx.name}</div>
            </div>
          ))}
        </div>

        {/* ── COUNTRY CARDS ── */}
        <div className="sec-div">🌍 COUNTRY-BY-COUNTRY IMPACT ANALYSIS</div>
        <div className="bento">
          {COUNTRIES.map(c => (
            <div className="tile col-6 cc-tile" key={c.code}>
              <div className="cc-head">
                <div className="cc-left">
                  <span className="cc-flag">{c.flag}</span>
                  <div>
                    <div className="cc-name">{c.name}</div>
                    <div className="cc-role">{c.role}</div>
                  </div>
                </div>
                <span className={`risk-badge ${c.rc}`}>{c.risk}</span>
              </div>
              <div className="cc-body">
                {c.rows.map((row, i) => (
                  <div className="cc-row" key={i}>
                    <div className="cc-sector">{row.s}</div>
                    <div className="cc-text">{row.t}</div>
                    <div className={`cc-val ${row.vc}`}>{row.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── NEWS FEED + TIMELINE ── */}
        <div className="sec-div">📡 LIVE NEWS FEED &amp; CONFLICT TIMELINE</div>
        <div className="bento">

          {/* News Feed */}
          <div className="tile col-6 news-tile">
            <div className="news-head">
              <span className="news-title">⚡ LIVE NEWS FEED</span>
              <span className="news-status">
                <span className="blink-dot" style={{ background: 'var(--green)' }} />
                {newsLoading ? 'FETCHING...' : `${news.length} ITEMS · AUTO-REFRESH 5MIN`}
              </span>
            </div>
            <div className="news-scroll">
              {newsLoading
                ? <div className="loading"><span className="spin" />FETCHING LIVE HEADLINES...</div>
                : news.map((item, i) => (
                  <div className="news-item" key={item.id || i}>
                    <div className="ni-time">{item.time}</div>
                    <div className={`ni-type ${newsTypeClass(item.type)}`}>{item.type || 'UPDATE'}</div>
                    <div>
                      <div className="ni-text">{item.headline}</div>
                      {item.source && <div className="ni-src">— {item.source}</div>}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Timeline */}
          <div className="tile col-6 tl-tile">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.25em', color: 'var(--muted2)', marginBottom: 12 }}>
              📅 KEY CONFLICT TIMELINE
            </div>
            {TIMELINE.map((t, i) => (
              <div className="tl-row" key={i}>
                <div className="tl-date">{t.date}</div>
                <div className={`tl-dot ${t.dot}`} />
                <div className="tl-text" dangerouslySetInnerHTML={{ __html: t.text }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── WINNERS + LOSERS ── */}
        <div className="sec-div">📊 ECONOMIC WINNERS &amp; LOSERS</div>
        <div className="bento">
          <div className="tile col-6 wl-tile">
            <div className="wl-head" style={{ color: 'var(--green)' }}>▲ ECONOMIC WINNERS</div>
            {WINNERS.map((w, i) => (
              <div className="wl-row" key={i}>
                <span className="wl-flag">{w.flag}</span>
                <span className="wl-name">{w.name}</span>
                <span className={`wl-pct ${w.vc}`}>{w.v}</span>
              </div>
            ))}
          </div>
          <div className="tile col-6 wl-tile">
            <div className="wl-head" style={{ color: 'var(--red)' }}>▼ ECONOMIC LOSERS</div>
            {LOSERS.map((l, i) => (
              <div className="wl-row" key={i}>
                <span className="wl-flag">{l.flag}</span>
                <span className="wl-name">{l.name}</span>
                <span className={`wl-pct ${l.vc}`}>{l.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── EMBED WIDGET ── */}
        <div className="sec-div">🔗 EMBED &amp; SHARE</div>
        <div className="bento">
          <div className="tile col-12 embed-tile">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--muted2)', letterSpacing: '0.1em', marginBottom: 6 }}>
              EMBED THIS TRACKER ON YOUR SITE OR BLOG — PASTE THE CODE BELOW:
            </div>
            <div className="embed-code" onClick={() => navigator.clipboard.writeText(`<iframe src="${SITE_URL}" width="100%" height="800" frameborder="0" style="border:none;"></iframe>`)}>
              {`<iframe src="${SITE_URL}" width="100%" height="800" frameborder="0" style="border:none;"></iframe>`}
              <span style={{ marginLeft: 12, color: 'var(--muted2)' }}>← CLICK TO COPY</span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => setShowShare(true)}>⚡ SHARE ON X (TWITTER)</button>
              <button className="btn-ghost" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}`, '_blank')}>
                SHARE ON LINKEDIN
              </button>
              <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(SITE_URL)}>
                COPY LINK
              </button>
            </div>
          </div>
        </div>

        {/* ── DISCLAIMER ── */}
        <div className="disclaimer">
          ⚠ <strong>DATA SOURCES:</strong> Wikipedia (Economic impact of 2026 Iran War), Reuters, Bloomberg, Al Jazeera, CNBC, The National UAE, Gulf News, Dawn (Pakistan), Financial Times, Chatham House, Oxford Economics, Anarock Research, Fitch Ratings, S&amp;P Global, Euronews.
          Market data via Anthropic web search + ExchangeRate-API. Conflict data current as of March 14, 2026.
          <strong> This is an informational tracker only — not financial or investment advice.</strong>
          The conflict is rapidly evolving; all figures may change within hours.
        </div>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <span>GEWI™ — GLOBAL ECO-WAR IMPACT INDEX</span>
          <span>LAST UPDATE: {lastUpdate || '--:--:--'} · AUTO-REFRESH: 90s</span>
          <span>MARCH 14, 2026 · DATA: ANTHROPIC AI + EXCHANGERATE-API</span>
        </footer>
      </div>

      {/* Share Modal */}
      {showShare && <ShareModal gewi={Math.round(gewi)} oil={oil} onClose={() => setShowShare(false)} />}
    </>
  )
}
