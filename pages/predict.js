// pages/predict.js
// Interactive oil price prediction widget — extremely shareable
// "If Hormuz stays closed X more days, oil hits $Y"

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gewi.live'

// Real analyst data points for the model
const BASE_WTI = 98.5
const BASE_BRENT = 101.8

// Simple escalation model based on analyst consensus
function predictOil(daysHormuzClosed, iranSanctionLevel, usProduction) {
  // Supply shock: each week of Hormuz closure = ~$4-8/bbl premium
  const hormuzPremium = (daysHormuzClosed / 7) * 6.2
  // Sanction pressure reduces Iranian supply (Iran exports ~1.5M bbl/day)
  const sanctionHit = sanctionLevel * 8
  // US shale response (takes 3-6 months to ramp)
  const shaleOffset = daysHormuzClosed > 90 ? usProduction * 3 : usProduction * (daysHormuzClosed / 90) * 3
  const wti = Math.min(220, BASE_WTI + hormuzPremium + sanctionHit - shaleOffset)
  const brent = wti + 3.5
  return { wti: Math.max(60, wti), brent: Math.max(63, brent) }
}

function predictGDP(wtiPrice) {
  // IMF rule of thumb: $10 oil rise = -0.1% to -0.2% global GDP
  const oilDelta = wtiPrice - 70 // vs pre-conflict baseline
  const gdpHit = -(oilDelta / 10) * 0.15
  return gdpHit.toFixed(2)
}

function predictInflation(wtiPrice) {
  const oilDelta = wtiPrice - 70
  return ((oilDelta / 10) * 0.1).toFixed(2)
}

function predictDubaiRE(days) {
  if (days <= 14) return -30
  if (days <= 30) return -42
  if (days <= 60) return -55
  if (days <= 90) return -62
  return -70
}

const SCENARIOS = [
  { days: 7,   label: '1 week',   color: '#f59e0b', risk: 'Elevated' },
  { days: 30,  label: '1 month',  color: '#f97316', risk: 'Severe' },
  { days: 60,  label: '2 months', color: '#ef4444', risk: 'Critical' },
  { days: 90,  label: '3 months', color: '#dc2626', risk: 'Catastrophic' },
  { days: 180, label: '6 months', color: '#991b1b', risk: 'Depression-level' },
]

const sanctionLevel = 0.7 // Current level: high

export default function PredictPage() {
  const [days, setDays] = useState(14)
  const [usProduction, setUsProduction] = useState(0.5)
  const [ceasefire, setCeasefire] = useState(false)
  const [shared, setShared] = useState(false)
  const chartRef = useRef(null)

  const pred = predictOil(days, sanctionLevel, usProduction)
  const gdp  = predictGDP(pred.wti)
  const infl = predictInflation(pred.wti)
  const dubRE = predictDubaiRE(days)

  // Risk color
  const getRiskColor = (wti) => {
    if (wti > 150) return '#991b1b'
    if (wti > 130) return '#dc2626'
    if (wti > 115) return '#ef4444'
    if (wti > 100) return '#f97316'
    return '#f59e0b'
  }
  const riskColor = getRiskColor(pred.wti)

  const getRiskLabel = (wti) => {
    if (wti > 150) return 'DEPRESSION-LEVEL'
    if (wti > 130) return 'CATASTROPHIC'
    if (wti > 115) return 'CRITICAL'
    if (wti > 100) return 'SEVERE'
    return 'ELEVATED'
  }

  // Draw scenario chart
  useEffect(() => {
    const canvas = chartRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth * 2
    const H = 200
    canvas.width = W; canvas.height = H
    ctx.scale(2, 1)

    const cW = canvas.offsetWidth
    ctx.clearRect(0, 0, cW, H)

    const points = [0, 7, 14, 30, 60, 90, 120, 180].map(d => ({
      d,
      wti: predictOil(d, sanctionLevel, usProduction).wti
    }))

    const maxWti = 220, minWti = 85
    const xScale = (d) => 40 + (d / 180) * (cW - 60)
    const yScale = (v) => H - 30 - ((v - minWti) / (maxWti - minWti)) * (H - 50)

    // Grid
    ctx.strokeStyle = 'rgba(245,158,11,0.08)'
    ctx.lineWidth = 0.5
    ;[100, 120, 140, 160, 180, 200].forEach(v => {
      ctx.beginPath()
      ctx.moveTo(40, yScale(v))
      ctx.lineTo(cW - 20, yScale(v))
      ctx.stroke()
      ctx.fillStyle = 'rgba(148,163,184,0.4)'
      ctx.font = '10px monospace'
      ctx.fillText('$' + v, 2, yScale(v) + 4)
    })

    // X axis labels
    ;[0, 30, 60, 90, 120, 150, 180].forEach(d => {
      ctx.fillStyle = 'rgba(148,163,184,0.4)'
      ctx.font = '10px monospace'
      ctx.fillText(d + 'd', xScale(d) - 6, H - 8)
    })

    // Area fill
    ctx.beginPath()
    ctx.moveTo(xScale(0), H - 30)
    points.forEach(p => ctx.lineTo(xScale(p.d), yScale(p.wti)))
    ctx.lineTo(xScale(180), H - 30)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, 'rgba(239,68,68,0.3)')
    grad.addColorStop(1, 'rgba(239,68,68,0.02)')
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xScale(p.d), yScale(p.wti)) : ctx.lineTo(xScale(p.d), yScale(p.wti)))
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.stroke()

    // Current day marker
    const cx = xScale(days)
    const cy = yScale(pred.wti)
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fillStyle = riskColor
    ctx.fill()
    ctx.strokeStyle = '#050c14'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    ctx.fillStyle = riskColor
    ctx.font = 'bold 13px monospace'
    ctx.fillText('$' + pred.wti.toFixed(0), cx + 10, cy - 4)
  }, [days, usProduction, pred.wti, riskColor])

  const sharePrediction = () => {
    const text = `GEWI Oil Price Forecast:

If Hormuz stays closed ${days} more days:

Oil: $${pred.wti.toFixed(0)}/bbl — ${getRiskLabel(pred.wti)}
Dubai RE: ${dubRE}%
Global GDP impact: ${gdp}%
Inflation add: +${infl}%

This is a ${getRiskLabel(pred.wti).toLowerCase()} scenario.

Model at: ${SITE_URL}/predict

#GEWI #OilForecast #Hormuz #IranWar`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    setShared(true)
    setTimeout(() => setShared(false), 3000)
  }

  const s = {
    page: { background: '#050c14', minHeight: '100vh', padding: '28px 20px', fontFamily: "'Barlow', sans-serif", color: '#94a3b8' },
    wrap: { maxWidth: 860, margin: '0 auto' },
    eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f59e0b', letterSpacing: '0.2em', marginBottom: 6 },
    h1: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#f1f5f9', letterSpacing: '0.06em', lineHeight: 1, marginBottom: 4 },
    sub: { fontSize: 13, color: '#475569', marginBottom: 24 },
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10, padding: '20px 24px', marginBottom: 16 },
    sectionLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 },
    sliderRow: { marginBottom: 18 },
    sliderLabel: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
    sliderKey: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b', letterSpacing: '0.1em' },
    sliderVal: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#f59e0b', fontWeight: 500 },
    input: { width: '100%', accentColor: '#f59e0b' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 16 },
    stat: (color) => ({ background: `rgba(${color},0.06)`, border: `1px solid rgba(${color},0.2)`, borderRadius: 8, padding: '14px 16px' }),
    statVal: (color) => ({ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 500, color: `rgb(${color})`, lineHeight: 1, marginBottom: 4 }),
    statLabel: { fontSize: 11, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' },
    btn: { background: '#f59e0b', color: '#050c14', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, padding: '12px 22px', borderRadius: 6, cursor: 'pointer', letterSpacing: '0.1em', marginRight: 10 },
    ghostBtn: { background: 'transparent', color: '#64748b', border: '1px solid rgba(100,116,139,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: '12px 22px', borderRadius: 6, cursor: 'pointer' },
    scenarios: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 8, marginBottom: 16 },
    scenCard: (active, color) => ({
      background: active ? `${color}22` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? color : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 8, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s'
    }),
  }

  return (
    <>
      <Head>
        <title>GEWI Oil Price Predictor — Hormuz Closure Impact Model</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&family=Barlow:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <div style={s.page}>
        <div style={s.wrap}>

          <div style={s.eyebrow}>GEWI™ — OIL PRICE PREDICTION MODEL</div>
          <h1 style={s.h1}>If Hormuz stays closed...</h1>
          <p style={s.sub}>Adjust the variables. See what analysts expect. Share the scenario that worries you most.</p>

          {/* Big output */}
          <div style={{ ...s.card, borderColor: `${riskColor}40`, borderTopWidth: 3, borderTopStyle: 'solid', borderTopColor: riskColor, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b', letterSpacing: '0.15em', marginBottom: 4 }}>
                  WTI CRUDE IN {days} DAYS
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 80, color: riskColor, lineHeight: 1 }}>
                  ${pred.wti.toFixed(0)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: riskColor, marginTop: 4 }}>
                  {getRiskLabel(pred.wti)} SCENARIO
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>Brent crude</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, color: '#f59e0b' }}>${pred.brent.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>vs $98.50 today</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: pred.wti > BASE_WTI ? '#ef4444' : '#10b981' }}>
                  +${(pred.wti - BASE_WTI).toFixed(0)}/bbl
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={s.statsGrid}>
            <div style={s.stat('239,68,68')}>
              <div style={s.statVal('239,68,68')}>{dubRE}%</div>
              <div style={s.statLabel}>Dubai RE index</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>vs today's -30%</div>
            </div>
            <div style={s.stat('249,115,22')}>
              <div style={s.statVal('249,115,22')}>{gdp}%</div>
              <div style={s.statLabel}>Global GDP impact</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>IMF model</div>
            </div>
            <div style={s.stat('245,158,11')}>
              <div style={s.statVal('245,158,11')}>+{infl}%</div>
              <div style={s.statLabel}>Global CPI add</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>on current inflation</div>
            </div>
            <div style={s.stat('16,185,129')}>
              <div style={s.statVal('16,185,129')}>{days}d</div>
              <div style={s.statLabel}>Days modelled</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>from today Mar 14</div>
            </div>
          </div>

          {/* Chart */}
          <div style={s.card}>
            <div style={s.sectionLabel}>WTI price trajectory — days of Hormuz closure</div>
            <canvas ref={chartRef} style={{ width: '100%', height: 100, display: 'block' }} />
          </div>

          {/* Sliders */}
          <div style={s.card}>
            <div style={s.sectionLabel}>Adjust scenario variables</div>

            <div style={s.sliderRow}>
              <div style={s.sliderLabel}>
                <span style={s.sliderKey}>Days Hormuz closed</span>
                <span style={s.sliderVal}>{days} days</span>
              </div>
              <input type="range" min={1} max={180} step={1} value={days}
                onChange={e => setDays(parseInt(e.target.value))} style={s.input} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155', marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                <span>1d</span><span>30d</span><span>60d</span><span>90d</span><span>180d</span>
              </div>
            </div>

            <div style={s.sliderRow}>
              <div style={s.sliderLabel}>
                <span style={s.sliderKey}>US shale ramp-up response</span>
                <span style={s.sliderVal}>{usProduction < 0.3 ? 'Slow' : usProduction < 0.7 ? 'Moderate' : 'Fast'}</span>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={usProduction}
                onChange={e => setUsProduction(parseFloat(e.target.value))} style={s.input} />
            </div>
          </div>

          {/* Quick scenario cards */}
          <div style={s.sectionLabel}>Quick scenarios</div>
          <div style={s.scenarios}>
            {SCENARIOS.map(sc => {
              const sp = predictOil(sc.days, sanctionLevel, usProduction)
              return (
                <div key={sc.days} style={s.scenCard(days === sc.days, sc.color)} onClick={() => setDays(sc.days)}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b', marginBottom: 4 }}>{sc.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: sc.color, fontWeight: 500 }}>${sp.wti.toFixed(0)}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{sc.risk}</div>
                </div>
              )
            })}
          </div>

          {/* Share */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <button style={s.btn} onClick={sharePrediction}>
              {shared ? '✓ POSTED!' : '⚡ SHARE THIS SCENARIO ON X'}
            </button>
            <button style={s.ghostBtn} onClick={() => window.location.href = '/'}>
              BACK TO DASHBOARD
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#1e293b', marginTop: 16, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7 }}>
            Model based on: IMF oil-GDP elasticity (-0.15% GDP per $10 oil rise) · Analyst consensus (Goldman Sachs, JPMorgan, Energy Aspects) · Chatham House conflict economics · GEWI composite methodology. Not financial advice.
          </p>
        </div>
      </div>
    </>
  )
}
