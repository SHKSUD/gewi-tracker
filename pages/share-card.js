// pages/share-card.js
// Renders a 1200x675 shareable image card for X/Twitter
// Visit /share-card?gewi=87&wti=98.5&brent=101.8&dubai=-30&hormuz=90
// Screenshot it or use /api/og to auto-generate PNG via Vercel OG

import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gewi.live'

function gewiLabel(s) {
  if (s >= 90) return 'CATASTROPHIC'
  if (s >= 80) return 'EXTREME STRESS'
  if (s >= 65) return 'SEVERE CRISIS'
  if (s >= 50) return 'HIGH TENSION'
  return 'ELEVATED RISK'
}

function gewiColor(s) {
  if (s >= 80) return '#ef4444'
  if (s >= 65) return '#f97316'
  if (s >= 50) return '#f59e0b'
  return '#10b981'
}

export default function ShareCard() {
  const canvasRef = useRef(null)
  const [params, setParams] = useState({ gewi: 87, wti: 98.5, brent: 101.8, dubai: -30, hormuz: 90 })
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    setParams({
      gewi:   parseFloat(p.get('gewi')   || '87'),
      wti:    parseFloat(p.get('wti')    || '98.5'),
      brent:  parseFloat(p.get('brent')  || '101.8'),
      dubai:  parseFloat(p.get('dubai')  || '-30'),
      hormuz: parseFloat(p.get('hormuz') || '90'),
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1200, H = 675
    canvas.width = W; canvas.height = H

    const score = Math.round(params.gewi)
    const accent = gewiColor(score)
    const label  = gewiLabel(score)

    // Background — deep dark
    ctx.fillStyle = '#050c14'
    ctx.fillRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = 'rgba(245,158,11,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

    // Left accent bar
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 6, H)

    // Top strip
    ctx.fillStyle = 'rgba(245,158,11,0.08)'
    ctx.fillRect(6, 0, W, 60)
    ctx.fillStyle = '#f59e0b'
    ctx.font = '500 14px monospace'
    ctx.fillText('GEWI™  —  GLOBAL ECO-WAR IMPACT INDEX', 40, 38)

    // Live dot
    ctx.fillStyle = '#ef4444'
    ctx.beginPath(); ctx.arc(W - 100, 30, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ef4444'
    ctx.font = '500 13px monospace'
    ctx.fillText('LIVE', W - 86, 35)

    // Date
    ctx.fillStyle = 'rgba(148,163,184,0.6)'
    ctx.font = '400 13px monospace'
    ctx.fillText('MARCH 14, 2026  ·  DAY 14 OF CONFLICT', W - 500, 38)

    // Giant GEWI Score
    ctx.fillStyle = accent
    ctx.font = `500 200px 'Georgia', serif`
    ctx.fillText(score, 40, 330)

    // /100
    ctx.fillStyle = 'rgba(148,163,184,0.5)'
    ctx.font = '400 48px monospace'
    ctx.fillText('/100', 40 + ctx.measureText(score).width + 10, 280)

    // Status label
    ctx.fillStyle = accent
    ctx.font = '500 36px monospace'
    ctx.fillText(label, 42, 380)

    // GEWI label below score
    ctx.fillStyle = 'rgba(148,163,184,0.5)'
    ctx.font = '400 16px monospace'
    ctx.fillText('GEWI SCORE', 44, 415)

    // Divider
    ctx.strokeStyle = 'rgba(245,158,11,0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(40, 450); ctx.lineTo(580, 450); ctx.stroke()
    ctx.setLineDash([])

    // Stats row — left panel
    const stats = [
      { label: 'WTI CRUDE OIL', value: `$${params.wti.toFixed(2)}`, sub: 'per barrel', color: '#f97316', up: true },
      { label: 'BRENT CRUDE',   value: `$${params.brent.toFixed(2)}`, sub: 'per barrel', color: '#f59e0b', up: true },
      { label: 'DUBAI RE INDEX',value: `${params.dubai}%`, sub: 'since Feb 28', color: '#ef4444', up: false },
      { label: 'HORMUZ TRAFFIC', value: `-${params.hormuz}%`, sub: 'vs normal', color: '#ef4444', up: false },
    ]

    stats.forEach((s, i) => {
      const x = 40 + (i % 2) * 280
      const y = 480 + Math.floor(i / 2) * 90
      ctx.fillStyle = s.color
      ctx.font = '500 28px monospace'
      ctx.fillText(s.value, x, y)
      ctx.fillStyle = 'rgba(148,163,184,0.8)'
      ctx.font = '400 13px monospace'
      ctx.fillText(s.label, x, y + 22)
      ctx.fillStyle = 'rgba(148,163,184,0.4)'
      ctx.font = '400 12px monospace'
      ctx.fillText(s.sub, x, y + 38)
    })

    // Right panel — vertical divider
    ctx.strokeStyle = 'rgba(245,158,11,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(640, 70); ctx.lineTo(640, H - 40); ctx.stroke()

    // Right side — key impacts
    const impacts = [
      { icon: '⚡', label: 'STRAIT OF HORMUZ', val: 'EFFECTIVELY CLOSED', sub: '20% of global oil supply offline', c: '#ef4444' },
      { icon: '🏢', label: 'DUBAI REAL ESTATE', val: '-30% IN 2 WEEKS', sub: 'DFM index wiped all 2026 gains', c: '#ef4444' },
      { icon: '🌍', label: 'COUNTRIES HIT', val: '10+ NATIONS', sub: 'UAE, Pakistan, Europe, Asia — all affected', c: '#f97316' },
      { icon: '⛽', label: 'OIL FORECAST', val: 'UP TO $130/BBL', sub: 'Analysts warn if Hormuz stays closed', c: '#f59e0b' },
      { icon: '📉', label: 'GLOBAL GDP RISK', val: '-0.8% GLOBAL CPI ADD', sub: 'IMF warns stagflation scenario', c: '#f59e0b' },
      { icon: '🚢', label: 'SHIPPING', val: '9+ VESSELS TARGETED', sub: 'Marine insurance cancelled in Gulf', c: '#f97316' },
    ]

    impacts.forEach((imp, i) => {
      const x = 670
      const y = 90 + i * 95

      // Card bg
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      ctx.beginPath()
      ctx.roundRect(x, y, 490, 80, 6)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      // Left accent
      ctx.fillStyle = imp.c
      ctx.fillRect(x, y, 3, 80)

      // Label
      ctx.fillStyle = 'rgba(148,163,184,0.6)'
      ctx.font = '400 11px monospace'
      ctx.fillText(imp.label, x + 16, y + 22)

      // Value
      ctx.fillStyle = imp.c
      ctx.font = '500 20px monospace'
      ctx.fillText(imp.val, x + 16, y + 48)

      // Sub
      ctx.fillStyle = 'rgba(148,163,184,0.5)'
      ctx.font = '400 12px monospace'
      ctx.fillText(imp.sub, x + 16, y + 66)
    })

    // Footer bar
    ctx.fillStyle = 'rgba(245,158,11,0.08)'
    ctx.fillRect(0, H - 50, W, 50)

    ctx.fillStyle = 'rgba(148,163,184,0.5)'
    ctx.font = '400 13px monospace'
    ctx.fillText('Track live at  ' + SITE_URL, 40, H - 18)

    ctx.fillStyle = '#f59e0b'
    ctx.font = '500 13px monospace'
    ctx.fillText('#GEWI  #IranWar  #OilPrice  #GlobalEconomy  #Dubai', W - 580, H - 18)

  }, [params])

  const downloadCard = async () => {
    setDownloading(true)
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `GEWI-${Math.round(params.gewi)}-${new Date().toISOString().slice(0,10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setTimeout(() => setDownloading(false), 1000)
  }

  const copyTweet = () => {
    const score = Math.round(params.gewi)
    const tweet = `🚨 GEWI Score: ${score}/100 — ${gewiLabel(score)}

Global Eco-War Impact Index · Iran–US Conflict · March 14, 2026

⚡ Oil: $${params.wti.toFixed(2)}/bbl (+1.4%)
🚢 Hormuz: CLOSED (−${params.hormuz}% traffic)
🏢 Dubai RE: ${params.dubai}% since Feb 28
📉 Stagflation risk rising · Fed paralysed

Track live → ${SITE_URL}

#GEWI #IranWar #OilPrice #GlobalEconomy #Dubai`
    navigator.clipboard.writeText(tweet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const tweetWithCard = () => {
    const score = Math.round(params.gewi)
    const text = `🚨 GEWI: ${score}/100 — ${gewiLabel(score)}\n\nOil $${params.wti.toFixed(2)} · Hormuz CLOSED · Dubai RE ${params.dubai}%\n\nTrack live → ${SITE_URL}\n\n#GEWI #IranWar #OilPrice`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      <Head>
        <title>GEWI Share Card Generator</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&family=Barlow:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ background: '#050c14', minHeight: '100vh', padding: '32px 24px', fontFamily: "'Barlow', sans-serif" }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f59e0b', letterSpacing: '0.2em', marginBottom: 6 }}>
              GEWI™ — SHARE CARD GENERATOR
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#f1f5f9', letterSpacing: '0.06em', lineHeight: 1 }}>
              Generate your viral X card
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
              Download the 1200×675px PNG, attach it to your tweet for maximum reach — images get 3× more impressions than links alone.
            </p>
          </div>

          {/* Controls */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#64748b', letterSpacing: '0.2em', marginBottom: 16 }}>ADJUST VALUES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16 }}>
              {[
                { key: 'gewi',   label: 'GEWI Score', min: 0,   max: 100,  step: 1,   suffix: '/100' },
                { key: 'wti',    label: 'WTI (USD)',  min: 60,  max: 200,  step: 0.5, suffix: '/bbl' },
                { key: 'brent',  label: 'Brent (USD)',min: 60,  max: 200,  step: 0.5, suffix: '/bbl' },
                { key: 'dubai',  label: 'Dubai RE %', min: -60, max: 20,   step: 1,   suffix: '%' },
                { key: 'hormuz', label: 'Hormuz -% ', min: 0,   max: 100,  step: 1,   suffix: '%' },
              ].map(ctrl => (
                <div key={ctrl.key}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#64748b', marginBottom: 6, letterSpacing: '0.1em' }}>{ctrl.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: '#f59e0b', marginBottom: 4 }}>
                    {params[ctrl.key].toFixed(ctrl.step < 1 ? 1 : 0)}{ctrl.suffix}
                  </div>
                  <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                    value={params[ctrl.key]}
                    onChange={e => setParams(p => ({ ...p, [ctrl.key]: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Canvas preview */}
          <div style={{ border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
            <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={downloadCard}
              style={{ background: '#f59e0b', color: '#050c14', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, padding: '12px 24px', borderRadius: 6, cursor: 'pointer', letterSpacing: '0.1em' }}>
              {downloading ? '✓ DOWNLOADING...' : '↓ DOWNLOAD PNG (1200×675)'}
            </button>
            <button onClick={tweetWithCard}
              style={{ background: 'transparent', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: '12px 24px', borderRadius: 6, cursor: 'pointer' }}>
              POST TO X / TWITTER
            </button>
            <button onClick={copyTweet}
              style={{ background: 'transparent', color: '#64748b', border: '1px solid rgba(100,116,139,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: '12px 24px', borderRadius: 6, cursor: 'pointer' }}>
              {copied ? '✓ COPIED!' : 'COPY TWEET TEXT'}
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#334155', marginTop: 16, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
            TIP: Download the PNG → compose a new tweet → attach the image → add your caption → post. Images get 3× more impressions. Do this every time GEWI moves ±3 points.
          </p>
        </div>
      </div>
    </>
  )
}
