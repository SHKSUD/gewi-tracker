// pages/api/subscribe.js
// Email subscription handler
// Supports: Mailchimp, Beehiiv, ConvertKit, or simple file storage
// Set MAILCHIMP_API_KEY + MAILCHIMP_LIST_ID in Vercel env vars

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, threshold, frequency, source, trigger } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  // ── OPTION 1: MAILCHIMP ──────────────────────────────────────────────────
  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) {
    try {
      const datacenter = process.env.MAILCHIMP_API_KEY.split('-').pop()
      const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`anystring:${process.env.MAILCHIMP_API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'pending', // double opt-in
          merge_fields: {
            GEWI_THRESH: threshold ? String(threshold) : '90',
            SOURCE: source || 'web',
            FREQUENCY: frequency || 'daily',
          },
          tags: ['gewi-tracker', source || 'web', trigger || 'organic'],
        }),
      })

      const data = await r.json()
      if (r.ok || data.title === 'Member Exists') {
        return res.json({ success: true, provider: 'mailchimp' })
      }
      throw new Error(data.detail || 'Mailchimp error')
    } catch (err) {
      console.error('Mailchimp error:', err.message)
    }
  }

  // ── OPTION 2: BEEHIIV ────────────────────────────────────────────────────
  if (process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUB_ID) {
    try {
      const r = await fetch(`https://api.beehiiv.com/v2/publications/${process.env.BEEHIIV_PUB_ID}/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
          custom_fields: [
            { name: 'gewi_threshold', value: threshold ? String(threshold) : '90' },
            { name: 'source', value: source || 'web' },
          ],
        }),
      })
      if (r.ok) return res.json({ success: true, provider: 'beehiiv' })
    } catch (err) {
      console.error('Beehiiv error:', err.message)
    }
  }

  // ── OPTION 3: CONVERTKIT ─────────────────────────────────────────────────
  if (process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_FORM_ID) {
    try {
      const r = await fetch(`https://api.convertkit.com/v3/forms/${process.env.CONVERTKIT_FORM_ID}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.CONVERTKIT_API_KEY,
          email,
          fields: {
            gewi_threshold: threshold ? String(threshold) : '90',
            source: source || 'web',
          },
        }),
      })
      if (r.ok) return res.json({ success: true, provider: 'convertkit' })
    } catch (err) {
      console.error('ConvertKit error:', err.message)
    }
  }

  // ── FALLBACK: Log to console (dev mode) ──────────────────────────────────
  console.log(`[GEWI Subscribe] email=${email} threshold=${threshold} source=${source} freq=${frequency}`)
  return res.json({
    success: true,
    provider: 'demo',
    message: 'Logged — connect Mailchimp, Beehiiv, or ConvertKit via env vars to capture real subscribers',
  })
}
