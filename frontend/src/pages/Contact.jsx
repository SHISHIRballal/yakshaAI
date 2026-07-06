import React, { useState } from 'react'

const FAQ = [
  { q: 'How does YakshaAI recommend artists?', a: 'Our AI engine analyzes budget, location, performance style, ratings, and experience to compute a compatibility score for each artist.' },
  { q: 'How do I book a Yakshagana artist?', a: 'Browse artists, select one you like, and click "Book". Fill in your event details and the artist will respond within 24 hours.' },
  { q: 'Are all artists verified?', a: 'Artists with the "Verified" badge have been reviewed by our cultural experts. We verify credentials, experience, and past performance quality.' },
  { q: 'What is Badagu Tittu vs Tenkutittu?', a: 'These are the two main regional styles of Yakshagana. Badagu Tittu is from northern coastal Karnataka, Tenkutittu from southern coastal Karnataka.' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.08) 0%, transparent 100%)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>💬</div>
          <div className="section-subtitle">Get in Touch</div>
          <h1>Contact YakshaAI</h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 500, margin: 'var(--space-3) auto 0' }}>
            Questions about bookings, artist support, or partnerships? We're here to help.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-10)' }}>
          {/* Contact Form */}
          <div>
            {submitted ? (
              <div className="dashboard-card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--font-body)', marginBottom: 'var(--space-3)' }}>Message Sent!</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>We'll get back to you within 24 hours.</p>
                <button className="btn btn-outline" style={{ marginTop: 'var(--space-5)' }} onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="dashboard-card">
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                  Send us a message
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input type="text" className="form-input" required placeholder="Full name"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-input" required placeholder="your@email.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Subject *</label>
                  <select className="form-select" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                    <option value="">Select a topic...</option>
                    <option>Booking Support</option>
                    <option>Artist Registration</option>
                    <option>Technical Issue</option>
                    <option>Partnership Inquiry</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label className="form-label">Message *</label>
                  <textarea className="form-textarea" required rows={5}
                    placeholder="Tell us how we can help..."
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full">
                  📨 Send Message
                </button>
              </form>
            )}
          </div>

          {/* Right side */}
          <div>
            {/* Contact info */}
            <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-5)' }}>
                Contact Information
              </h3>
              {[
                { icon: '📧', label: 'Email', value: 'support@yakshagai.com' },
                { icon: '📞', label: 'Phone', value: '+91 80 1234 5678' },
                { icon: '📍', label: 'Office', value: 'Bengaluru, Karnataka, India' },
                { icon: '⏰', label: 'Hours', value: 'Mon–Sat, 9am–6pm IST' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--space-1)' }}>{label}</div>
                    <div style={{ fontSize: '0.9rem' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="dashboard-card">
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-5)' }}>
                Frequently Asked Questions
              </h3>
              {FAQ.map((faq, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>{faq.q}</span>
                    <span style={{ color: 'var(--color-gold)', flexShrink: 0 }}>{openFaq === i ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === i && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginTop: 'var(--space-3)' }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
