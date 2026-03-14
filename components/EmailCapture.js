// components/EmailCapture.js
// Email capture modal + inline form
// Integrates with Mailchimp or Beehiiv (just swap the endpoint)
// Also handles GEWI alert threshold notifications

import { useState } from 'react'

const THRESHOLDS = [
  { score: 80, label: 'Severe crisis', color: '#f97316' },
  { score: 85, label: 'Extreme stress', color: '#ef4444' },
  { score: 90, label: 'Catastrophic', color: '#dc2626' },
  { score: 95, label: 'Near-collapse', color: '#991b1b' },
]

// ── INLINE CAPTURE BAR (goes at bottom of dashboard) ──────────────────────
export function EmailCaptureBar({ currentGEWI = 87 }) {
  const [email, setEmail] = useState('')
  const [threshold, setThreshold] = useState(90)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, threshold, source: 'bar' }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      // Demo mode — show success anyway
      setStatus('success')
    }
  }

  if (status === 'success') {
    return (
      <div style={styles.bar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#10b981', fontSize: 16 }}>✓</span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#10b981', fontWeight: 500 }}>
              Alert set — you'll be notified when GEWI hits {threshold}/100
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              Check your inbox to confirm. Daily GEWI brief also included.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.bar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={styles.barLabel}>Get GEWI alerts</div>
          <div style={styles.barSub}>Current score: {currentGEWI}/100</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <select
            value={threshold}
            onChange={e => setThreshold(parseInt(e.target.value))}
            style={styles.select}
          >
            {THRESHOLDS.map(t => (
              <option key={t.score} value={t.score}>
                Alert when GEWI &gt; {t.score} ({t.label})
              </option>
            ))}
            <option value={0}>Daily brief (every morning)</option>
          </select>
          <button type="submit" style={styles.btn} disabled={status === 'loading'}>
            {status === 'loading' ? 'Setting...' : 'Set alert'}
          </button>
        </form>

        <div style={{ fontSize: 10, color: '#334155', flexShrink: 0, maxWidth: 160 }}>
          No spam. Unsubscribe anytime. ~300 subscribers already tracking.
        </div>
      </div>
    </div>
  )
}

// ── POPUP MODAL (shown after 45s on site or when GEWI jumps) ──────────────
export function EmailModal({ onClose, currentGEWI = 87, trigger = 'time' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [freq, setFreq] = useState('daily')

  const triggerMessages = {
    time: { headline: 'Stay ahead of the crisis', sub: "You've been tracking GEWI for 45 seconds. Get the daily brief straight to your inbox." },
    spike: { headline: `GEWI just moved to ${currentGEWI}/100`, sub: 'This is a significant escalation. Get instant alerts when GEWI moves.' },
    exit: { headline: 'Before you go...', sub: 'Get the GEWI daily brief — the fastest way to track global conflict economics.' },
  }

  const msg = triggerMessages[trigger] || triggerMessages.time

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency: freq, source: 'modal', trigger }),
      })
      setStatus('success')
    } catch {
      setStatus('success') // Demo mode
    }
  }

  // Overlay (non-fixed — uses normal flow)
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={styles.modalTitle}>You're in.</div>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '12px 0 20px' }}>
              First GEWI brief lands tomorrow morning. You'll get instant alerts whenever the score moves significantly.
            </p>
            <button onClick={onClose} style={styles.btn}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={styles.eyebrow}>GEWI™ alerts</div>
                <div style={styles.modalTitle}>{msg.headline}</div>
              </div>
              <button onClick={onClose} style={styles.closeBtn}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>{msg.sub}</p>

            {/* What you get */}
            <div style={styles.benefitList}>
              {[
                { icon: '⚡', text: 'Instant alert when GEWI crosses your threshold' },
                { icon: '📊', text: 'Daily GEWI brief — score, oil price, key overnight events' },
                { icon: '🌍', text: 'Country spotlight — deep-dive on the most impacted nation' },
                { icon: '📈', text: 'Weekly forecast — where oil, the dollar, and Dubai RE are heading' },
              ].map((b, i) => (
                <div key={i} style={styles.benefit}>
                  <span style={{ fontSize: 14, width: 20, flexShrink: 0 }}>{b.icon}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{b.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ ...styles.input, width: '100%', marginBottom: 10 }}
                required
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {['daily', 'alerts-only', 'weekly'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFreq(f)}
                    style={{
                      ...styles.freqBtn,
                      background: freq === f ? 'rgba(245,158,11,0.15)' : 'transparent',
                      borderColor: freq === f ? '#d97706' : 'rgba(100,116,139,0.2)',
                      color: freq === f ? '#f59e0b' : '#64748b',
                    }}
                  >
                    {f === 'daily' ? 'Daily + alerts' : f === 'alerts-only' ? 'Alerts only' : 'Weekly digest'}
                  </button>
                ))}
              </div>
              <button type="submit" style={{ ...styles.btn, width: '100%' }} disabled={status === 'loading'}>
                {status === 'loading' ? 'Setting up your alerts...' : 'Get GEWI alerts — free'}
              </button>
            </form>

            <p style={{ fontSize: 10, color: '#334155', marginTop: 10, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
              No spam. No credit card. Unsubscribe in one click. Join ~300 analysts, traders & journalists already tracking.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ── ALERT THRESHOLD BADGE (shows in header) ────────────────────────────────
export function AlertBadge({ currentGEWI, onSetAlert }) {
  const crossed = THRESHOLDS.filter(t => currentGEWI >= t.score)
  const highest = crossed[crossed.length - 1]

  if (!highest) return null

  return (
    <div
      onClick={onSetAlert}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: `${highest.color}15`,
        border: `1px solid ${highest.color}40`,
        borderRadius: 6,
        padding: '4px 10px',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: highest.color,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: highest.color, display: 'inline-block' }} />
      GEWI {currentGEWI} — {highest.label.toUpperCase()}
      <span style={{ fontSize: 10, opacity: 0.7 }}>· Set alert</span>
    </div>
  )
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const styles = {
  bar: {
    background: 'rgba(245,158,11,0.06)',
    border: '1px solid rgba(245,158,11,0.15)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 16,
  },
  barLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 500,
    color: '#f59e0b',
    letterSpacing: '0.1em',
  },
  barSub: { fontSize: 11, color: '#475569', marginTop: 2 },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(100,116,139,0.25)',
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 13,
    color: '#f1f5f9',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    minWidth: 200,
  },
  select: {
    background: '#0a1520',
    border: '1px solid rgba(100,116,139,0.25)',
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  btn: {
    background: '#f59e0b',
    color: '#050c14',
    border: 'none',
    borderRadius: 6,
    padding: '10px 18px',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  overlay: {
    background: 'rgba(5,12,20,0.85)',
    padding: '60px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  modal: {
    background: '#071620',
    border: '1px solid rgba(245,158,11,0.2)',
    borderTop: '2px solid #f59e0b',
    borderRadius: 12,
    padding: '28px 32px',
    maxWidth: 480,
    width: '100%',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: '#f59e0b',
    letterSpacing: '0.2em',
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    color: '#f1f5f9',
    letterSpacing: '0.06em',
    lineHeight: 1.1,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#475569',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
    lineHeight: 1,
  },
  benefitList: { display: 'flex', flexDirection: 'column', gap: 8 },
  benefit: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  freqBtn: {
    flex: 1,
    background: 'transparent',
    border: '1px solid rgba(100,116,139,0.2)',
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
}
