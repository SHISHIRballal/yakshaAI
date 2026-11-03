import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

const CITIES = ['Udupi', 'Mangaluru', 'Dharwad', 'Bengaluru', 'Kundapur', 'Karwar', 'Sirsi', 'Honavar', 'Mysuru', 'Hubli']
const EVENT_TYPES = ['Temple Festival', 'Wedding Ceremony', 'Cultural Program', 'Corporate Event', 'College Event', 'National Competition', 'International Festival']

const ALGORITHMS = [
  {
    key: 'random_forest',
    label: 'Random Forest',
    icon: '🌲',
    desc: 'Ensemble of 10 decision trees — most accurate',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.3)',
  },
  {
    key: 'knn',
    label: 'K-Nearest Neighbors',
    icon: '🔵',
    desc: 'Finds 7 nearest matches from training data',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    key: 'decision_tree',
    label: 'Decision Tree',
    icon: '🌳',
    desc: 'Rule-based splits on key artist features',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    key: 'weighted',
    label: 'Weighted Score',
    icon: '⚖️',
    desc: 'Original weighted multi-factor scoring',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.3)',
  },
]

const ALGO_COLORS = {
  'KNN': '#6366f1',
  'Decision Tree': '#f59e0b',
  'Random Forest': '#22c55e',
  'weighted': '#ec4899',
}

// ─── SVG Bar Chart Component ──────────────────────────────────
function BarChart({ data, title, subtitle, valueFormatter = v => `${v}%` }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const barW = 100 / data.length
  const [hovered, setHovered] = useState(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [data])

  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{title}</div>}
      {subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{subtitle}</div>}
      <svg viewBox="0 0 400 180" style={{ width: '100%', overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = 150 - (pct / 100) * 130
          return (
            <g key={pct}>
              <line x1={30} y1={y} x2={400} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={26} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize={9} textAnchor="end">{pct}</text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = animated ? (d.value / maxVal) * 130 : 0
          const x = 35 + i * ((400 - 35) / data.length) + 4
          const w = ((400 - 35) / data.length) - 8
          const y = 150 - barHeight
          const isHov = hovered === i
          return (
            <g key={i}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              {/* Glow shadow */}
              {isHov && (
                <rect x={x} y={y} width={w} height={barHeight}
                  fill={d.color} rx={4} opacity={0.15} style={{ filter: `blur(8px)` }} />
              )}
              {/* Bar */}
              <rect
                x={x} y={y} width={w} height={barHeight}
                fill={d.color} rx={4} opacity={isHov ? 1 : 0.85}
                style={{ transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
              {/* Value label */}
              {barHeight > 16 && (
                <text x={x + w / 2} y={y + Math.min(barHeight - 6, 20)} fill="white"
                  fontSize={9} textAnchor="middle" fontWeight={700}>
                  {valueFormatter(d.value)}
                </text>
              )}
              {/* X label */}
              <text x={x + w / 2} y={165} fill={isHov ? d.color : 'rgba(255,255,255,0.5)'}
                fontSize={8.5} textAnchor="middle" style={{ transition: 'fill 0.2s' }}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {/* Hover tooltip */}
      {hovered !== null && (
        <div style={{
          background: 'rgba(10,10,20,0.95)', border: `1px solid ${data[hovered].color}40`,
          borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem',
          color: 'white', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: data[hovered].color, display: 'inline-block' }} />
          <b>{data[hovered].label}</b>: {valueFormatter(data[hovered].value)}
        </div>
      )}
    </div>
  )
}

// ─── Radar Chart Component ────────────────────────────────────
function RadarChart({ algorithms, features, scores }) {
  const cx = 150, cy = 145, r = 110
  const n = features.length
  const [hovered, setHovered] = useState(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [scores])

  const angle = (i) => (i * 2 * Math.PI / n) - Math.PI / 2

  const point = (i, val, maxVal) => {
    const a = angle(i)
    const scale = animated ? (val / (maxVal || 1)) : 0
    return {
      x: cx + r * scale * Math.cos(a),
      y: cy + r * scale * Math.sin(a),
    }
  }

  const labelPoint = (i) => {
    const a = angle(i)
    const dist = r + 22
    return { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) }
  }

  // Find max per feature across all algos for normalization
  const maxPerFeature = features.map((_, fi) =>
    Math.max(...algorithms.map(alg => (scores[alg.label]?.[fi] || 0)), 1)
  )

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 340, overflow: 'visible' }}>
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon key={scale} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1}
            points={features.map((_, i) => {
              const a = angle(i)
              return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`
            }).join(' ')} />
        ))}
        {/* Axis lines */}
        {features.map((_, i) => {
          const a = angle(i)
          return (
            <line key={i}
              x1={cx} y1={cy}
              x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
              stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          )
        })}
        {/* Polygon for each algorithm */}
        {algorithms.map((alg, ai) => {
          const pts = features.map((_, fi) => {
            const p = point(fi, scores[alg.label]?.[fi] || 0, maxPerFeature[fi])
            return `${p.x},${p.y}`
          }).join(' ')
          const isHov = hovered === ai
          return (
            <g key={ai}>
              <polygon points={pts}
                fill={alg.color} fillOpacity={isHov ? 0.25 : 0.08}
                stroke={alg.color} strokeWidth={isHov ? 2.5 : 1.5}
                strokeOpacity={isHov ? 1 : 0.7}
                style={{ transition: 'all 0.4s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(ai)}
                onMouseLeave={() => setHovered(null)}
              />
              {features.map((_, fi) => {
                const p = point(fi, scores[alg.label]?.[fi] || 0, maxPerFeature[fi])
                return (
                  <circle key={fi} cx={p.x} cy={p.y} r={isHov ? 4 : 3}
                    fill={alg.color} opacity={isHov ? 1 : 0.6}
                    style={{ transition: 'all 0.3s' }}
                    onMouseEnter={() => setHovered(ai)}
                    onMouseLeave={() => setHovered(null)}
                  />
                )
              })}
            </g>
          )
        })}
        {/* Feature labels */}
        {features.map((feat, i) => {
          const lp = labelPoint(i)
          return (
            <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.6)" fontSize={8.5} fontWeight={600}>
              {feat}
            </text>
          )
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {algorithms.map((alg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem',
            cursor: 'pointer', opacity: hovered === null || hovered === i ? 1 : 0.4,
            transition: 'opacity 0.2s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: alg.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>{alg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Confusion Matrix ─────────────────────────────────────────
function ConfusionMatrix({ metrics, color }) {
  const { true_positives: tp, false_positives: fp, true_negatives: tn, false_negatives: fn } = metrics
  const cells = [
    { label: 'TP', value: tp, bg: `${color}30`, border: color, title: 'True Positives' },
    { label: 'FP', value: fp, bg: 'rgba(239,68,68,0.12)', border: '#ef4444', title: 'False Positives' },
    { label: 'FN', value: fn, bg: 'rgba(239,68,68,0.12)', border: '#ef4444', title: 'False Negatives' },
    { label: 'TN', value: tn, bg: `${color}20`, border: color, title: 'True Negatives' },
  ]
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 8, textAlign: 'center' }}>
        Confusion Matrix
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, maxWidth: 160, margin: '0 auto' }}>
        {cells.map((c, i) => (
          <div key={i} title={c.title} style={{
            background: c.bg, border: `1px solid ${c.border}60`,
            borderRadius: 6, padding: '8px 4px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c.border }}>{c.value}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block' }} />
          Correct
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: 2, display: 'inline-block' }} />
          Errors
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function Recommendations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const chartsRef = useRef(null)

  const [form, setForm] = useState({
    budget: 20000, city: '', event_type: '', performance_style: '',
    min_experience: 0, min_rating: 0, limit: 6,
  })
  const [algorithm, setAlgorithm] = useState('random_forest')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const [metrics, setMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState('')
  const [activeMetricTab, setActiveMetricTab] = useState('accuracy')

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // Load metrics on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      setMetricsLoading(true)
      try {
        const res = await api.get('/recommendations/metrics')
        setMetrics(res.data)
      } catch {
        setMetricsError('Could not load algorithm metrics.')
      } finally {
        setMetricsLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        budget: Number(form.budget),
        limit: form.limit,
        min_experience: Number(form.min_experience),
        min_rating: Number(form.min_rating),
        algorithm,
      }
      if (form.city) payload.city = form.city
      if (form.event_type) payload.event_type = form.event_type
      if (form.performance_style) payload.performance_style = form.performance_style
      const res = await api.post('/recommendations', payload)
      setResults(res.data)
      setSearched(true)
    } catch {
      setError('Failed to get recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMatchColor = (score) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#d4af37'
    if (score >= 40) return '#f59e0b'
    return 'var(--color-text-muted)'
  }

  const currentAlgo = ALGORITHMS.find(a => a.key === algorithm) || ALGORITHMS[0]

  // Build chart data from metrics
  const buildBarData = (metricKey) => {
    if (!metrics) return []
    return [
      { label: 'KNN', value: metrics.algorithms['KNN']?.[metricKey] || 0, color: '#6366f1' },
      { label: 'Dec. Tree', value: metrics.algorithms['Decision Tree']?.[metricKey] || 0, color: '#f59e0b' },
      { label: 'Rnd Forest', value: metrics.algorithms['Random Forest']?.[metricKey] || 0, color: '#22c55e' },
    ]
  }

  const featureImportanceData = (algoLabel) => {
    if (!metrics?.feature_importance?.scores?.[algoLabel]) return []
    return metrics.feature_importance.features.map((feat, i) => ({
      label: feat.split(' ')[0],
      value: metrics.feature_importance.scores[algoLabel][i] || 0,
      color: algoLabel === 'KNN' ? '#6366f1' : algoLabel === 'Decision Tree' ? '#f59e0b' : '#22c55e',
    }))
  }

  const METRIC_TABS = [
    { key: 'accuracy', label: 'Accuracy', icon: '🎯' },
    { key: 'precision', label: 'Precision', icon: '📐' },
    { key: 'recall', label: 'Recall', icon: '🔍' },
    { key: 'f1_score', label: 'F1 Score', icon: '⚡' },
  ]

  const radarAlgorithms = [
    { label: 'KNN', color: '#6366f1' },
    { label: 'Decision Tree', color: '#f59e0b' },
    { label: 'Random Forest', color: '#22c55e' },
  ]

  return (
    <div className="page-enter">
      {/* ─── Header ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(196,30,58,0.12), rgba(212,175,55,0.1), rgba(99,102,241,0.08))',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-10) 0 var(--space-8)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -40, left: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(99,102,241,0.06)', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, right: -30, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(34,197,94,0.06)', filter: 'blur(40px)',
        }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 'var(--space-3)' }}>🤖</div>
          <div className="section-subtitle">ML-Powered</div>
          <h1 style={{ marginBottom: 'var(--space-3)' }}>
            Smart Artist <span className="gradient-text">Recommendations</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 560, margin: '0 auto var(--space-5)', fontSize: '1rem' }}>
            Powered by KNN, Decision Tree & Random Forest — trained on 150 synthetic user interactions.
          </p>
          {/* Algorithm chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ALGORITHMS.map(a => (
              <span key={a.key} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                background: algorithm === a.key ? `${a.color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${algorithm === a.key ? a.color : 'rgba(255,255,255,0.1)'}`,
                color: algorithm === a.key ? a.color : 'var(--color-text-muted)',
                transition: 'all 0.2s', cursor: 'pointer',
              }} onClick={() => setAlgorithm(a.key)}>
                {a.icon} {a.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 'var(--space-7)', alignItems: 'start' }}>

          {/* ─── Left: Form ─── */}
          <div style={{ position: 'sticky', top: 88 }}>
            <form onSubmit={handleSubmit} className="dashboard-card">
              {/* Header */}
              <div style={{ marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                  Your Event Preferences
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Fill in as much as you know</p>
              </div>

              {/* Algorithm Toggle */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🧠</span> ML Algorithm
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ALGORITHMS.map(a => (
                    <button key={a.key} type="button"
                      onClick={() => setAlgorithm(a.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: algorithm === a.key ? `${a.color}15` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${algorithm === a.key ? a.color : 'rgba(255,255,255,0.08)'}`,
                        color: algorithm === a.key ? a.color : 'var(--color-text-muted)',
                        textAlign: 'left', transition: 'all 0.25s',
                        boxShadow: algorithm === a.key ? `0 0 16px ${a.glow}` : 'none',
                      }}>
                      <span style={{ fontSize: '1.3rem' }}>{a.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 2 }}>{a.label}</div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.75 }}>{a.desc}</div>
                      </div>
                      {algorithm === a.key && (
                        <span style={{
                          marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10,
                          background: a.color, color: '#000',
                        }}>ACTIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label">Budget for Artist</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-gold)', fontSize: '1.1rem' }}>
                    ₹ {Number(form.budget).toLocaleString('en-IN')}
                  </span>
                </div>
                <input type="range" min={5000} max={60000} step={1000}
                  value={form.budget} onChange={e => handleChange('budget', e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                  <span>₹5,000</span><span>₹60,000</span>
                </div>
              </div>

              {/* City */}
              <div className="form-group">
                <label className="form-label">Event Location</label>
                <select className="form-select" value={form.city} onChange={e => handleChange('city', e.target.value)}>
                  <option value="">Any City</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Event Type */}
              <div className="form-group">
                <label className="form-label">Event Type</label>
                <select className="form-select" value={form.event_type} onChange={e => handleChange('event_type', e.target.value)}>
                  <option value="">Any Event Type</option>
                  {EVENT_TYPES.map(et => <option key={et}>{et}</option>)}
                </select>
              </div>

              {/* Style */}
              <div className="form-group">
                <label className="form-label">Preferred Style</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {['', 'Badagu Tittu', 'Tenkutittu', 'Both'].map(s => (
                    <button key={s} type="button"
                      onClick={() => handleChange('performance_style', s)}
                      className={`btn btn-sm ${form.performance_style === s ? 'btn-gold' : 'btn-ghost'}`}>
                      {s || 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Experience */}
              <div className="form-group">
                <label className="form-label">Min. Experience: {form.min_experience}+ yrs</label>
                <input type="range" min={0} max={30} step={2}
                  value={form.min_experience} onChange={e => handleChange('min_experience', e.target.value)} />
              </div>

              {/* Min Rating */}
              <div className="form-group">
                <label className="form-label">Minimum Rating</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {[0, 3.5, 4, 4.5].map(r => (
                    <button key={r} type="button"
                      onClick={() => handleChange('min_rating', r)}
                      className={`btn btn-sm ${form.min_rating === r ? 'btn-gold' : 'btn-ghost'}`}>
                      {r === 0 ? 'Any' : `${r}★+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results count */}
              <div className="form-group">
                <label className="form-label">Number of Results</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {[3, 6, 9, 12].map(n => (
                    <button key={n} type="button"
                      onClick={() => handleChange('limit', n)}
                      className={`btn btn-sm ${form.limit === n ? 'btn-gold' : 'btn-ghost'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}
                style={{ boxShadow: `0 0 20px ${currentAlgo.glow}` }}>
                {loading
                  ? `🔄 ${currentAlgo.label} Analyzing...`
                  : `${currentAlgo.icon} Find My Artists`}
              </button>
            </form>
          </div>

          {/* ─── Right: Results ─── */}
          <div>
            {loading && <LoadingSpinner fullPage text={`${currentAlgo.label} is analyzing artists...`} />}

            {!loading && !searched && (
              <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', opacity: 0.3 }}>🎭</div>
                <h3 style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
                  Select an algorithm and search
                </h3>
                <p style={{ color: 'var(--color-text-dim)', marginTop: 'var(--space-2)', fontSize: '0.9rem' }}>
                  Choose from KNN, Decision Tree, or Random Forest to power your recommendations.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
                  {ALGORITHMS.slice(0, 3).map(a => (
                    <div key={a.key} style={{
                      padding: '12px 20px', borderRadius: 12, fontSize: '0.8rem',
                      background: `${a.color}10`, border: `1px solid ${a.color}30`,
                      color: a.color, fontWeight: 600,
                    }}>
                      {a.icon} {a.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && results && (
              <div>
                {/* Results header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {results.total} Artists Matched
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      Sorted by <span style={{ color: currentAlgo.color, fontWeight: 600 }}>{currentAlgo.label}</span> compatibility
                    </p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 20,
                    background: `${currentAlgo.color}15`, border: `1px solid ${currentAlgo.color}40`,
                    fontSize: '0.78rem', color: currentAlgo.color, fontWeight: 600,
                  }}>
                    {currentAlgo.icon} {currentAlgo.label}
                  </div>
                </div>

                {results.artists.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>🔍</div>
                    <h3>No matches found</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Try relaxing your filters.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {results.artists.map((artist, index) => (
                      <div key={artist.id} className="dashboard-card"
                        style={{
                          border: index === 0 ? `1px solid ${currentAlgo.color}50` : undefined,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s, transform 0.2s',
                        }}
                        onClick={() => navigate(`/artists/${artist.id}`)}>
                        {index === 0 && (
                          <div style={{ marginBottom: 'var(--space-3)' }}>
                            <span className="badge badge-gold">🏆 Best Match · {currentAlgo.label}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          {/* Photo */}
                          <div style={{
                            width: 68, height: 68, borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-surface-2)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', flexShrink: 0,
                            border: `2px solid ${getMatchColor(artist.match_score)}30`,
                          }}>
                            {artist.profile_photo_url
                              ? <img src={artist.profile_photo_url} alt={artist.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : '🎭'}
                          </div>

                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700 }}>
                                {artist.user_name}
                                {artist.is_verified && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--color-success)' }}>✓</span>}
                              </h3>
                              {/* Score badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                  padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                                  background: `${getMatchColor(artist.match_score)}18`,
                                  border: `1px solid ${getMatchColor(artist.match_score)}40`,
                                  color: getMatchColor(artist.match_score),
                                }}>
                                  🎯 {artist.match_score}%
                                </div>
                                {/* Score bar */}
                                <div style={{ width: 60, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${artist.match_score}%`, height: '100%',
                                    background: getMatchColor(artist.match_score),
                                    borderRadius: 3, transition: 'width 0.8s ease',
                                  }} />
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              <span>🎭 {artist.performance_style}</span>
                              <span>📍 {artist.city}</span>
                              <span>⭐ {artist.avg_rating}</span>
                              <span>🎪 {artist.experience_years} yrs</span>
                              <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                                ₹{artist.pricing_per_event?.toLocaleString('en-IN')}
                              </span>
                            </div>

                            {/* Match reasons */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {artist.match_reasons.map((reason, i) => (
                                <span key={i} style={{
                                  fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20,
                                  background: `${currentAlgo.color}10`,
                                  border: `1px solid ${currentAlgo.color}25`,
                                  color: 'var(--color-text-muted)',
                                }}>
                                  ✓ {reason}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/book/${artist.id}`) }}>Book</button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={e => {
                                e.stopPropagation();
                                const target = artist.user_id ? `user_id=${artist.user_id}` : `artist_id=${artist.id}`;
                                if (!user) {
                                  navigate(`/auth?redirect=/messages?${target}`);
                                } else {
                                  navigate(`/messages?${target}`);
                                }
                              }}
                              title="Direct message artist"
                            >
                              💬 Message
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); navigate(`/artists/${artist.id}`) }}>View</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Performance Analytics Section ─── */}
        <div ref={chartsRef} style={{ marginTop: 'var(--space-12)' }}>
          {/* Section header */}
          <div style={{
            textAlign: 'center', marginBottom: 'var(--space-8)',
            paddingTop: 'var(--space-8)',
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 'var(--space-3)' }}>📊</div>
            <div className="section-subtitle">Algorithm Analytics</div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-3)' }}>
              Performance <span className="gradient-text">Comparison</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: 560, margin: '0 auto', fontSize: '0.95rem' }}>
              All three algorithms evaluated on <strong style={{ color: 'var(--color-gold)' }}>150 synthetic user–artist interaction records</strong> with 5 engineered features.
            </p>
          </div>

          {metricsLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              Loading algorithm metrics...
            </div>
          ) : metricsError ? (
            <div className="alert alert-error">{metricsError}</div>
          ) : metrics && (
            <>
              {/* Dataset info banner */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)',
                marginBottom: 'var(--space-7)',
              }}>
                {[
                  { label: 'Training Samples', value: metrics.dataset_size, icon: '📦', color: '#6366f1' },
                  { label: 'Positive (Booked)', value: metrics.positive_samples, icon: '✅', color: '#22c55e' },
                  { label: 'Negative (Ignored)', value: metrics.negative_samples, icon: '❌', color: '#ef4444' },
                ].map((stat, i) => (
                  <div key={i} className="dashboard-card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Metric tabs */}
              <div className="dashboard-card" style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                  {METRIC_TABS.map(tab => (
                    <button key={tab.key} type="button"
                      onClick={() => setActiveMetricTab(tab.key)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        background: activeMetricTab === tab.key ? 'rgba(212,175,55,0.15)' : 'transparent',
                        border: activeMetricTab === tab.key ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: activeMetricTab === tab.key ? 'var(--color-gold)' : 'var(--color-text-muted)',
                        transition: 'all 0.2s',
                      }}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
                  {/* Bar chart */}
                  <div>
                    <BarChart
                      key={activeMetricTab}
                      data={buildBarData(activeMetricTab)}
                      title={`${METRIC_TABS.find(t => t.key === activeMetricTab)?.label} Comparison`}
                      subtitle="Higher is better"
                    />
                  </div>

                  {/* Metrics table */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
                      All Metrics Overview
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--color-text-dim)', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>Algorithm</th>
                            {METRIC_TABS.map(t => (
                              <th key={t.key} style={{
                                textAlign: 'center', padding: '8px 6px',
                                color: activeMetricTab === t.key ? 'var(--color-gold)' : 'var(--color-text-dim)',
                                borderBottom: '1px solid var(--color-border)', fontWeight: 600,
                              }}>{t.icon}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: 'KNN', key: 'KNN', color: '#6366f1' },
                            { label: 'Decision Tree', key: 'Decision Tree', color: '#f59e0b' },
                            { label: 'Random Forest', key: 'Random Forest', color: '#22c55e' },
                          ].map((algo, ri) => (
                            <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '9px 10px', fontWeight: 600 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: 2, background: algo.color, display: 'inline-block' }} />
                                  {algo.label}
                                </span>
                              </td>
                              {METRIC_TABS.map(t => {
                                const val = metrics.algorithms[algo.key]?.[t.key] || 0
                                const isActive = t.key === activeMetricTab
                                return (
                                  <td key={t.key} style={{
                                    textAlign: 'center', padding: '9px 6px',
                                    color: isActive ? algo.color : 'var(--color-text-muted)',
                                    fontWeight: isActive ? 700 : 400,
                                    background: isActive ? `${algo.color}08` : 'transparent',
                                  }}>
                                    {val}%
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Importance + Radar + Confusion Matrices */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>

                {/* Radar chart */}
                <div className="dashboard-card">
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.9rem' }}>📡 Feature Sensitivity Radar</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
                    How much each feature impacts each algorithm
                  </div>
                  <RadarChart
                    algorithms={radarAlgorithms}
                    features={metrics.feature_importance.features}
                    scores={metrics.feature_importance.scores}
                  />
                </div>

                {/* Confusion matrices */}
                <div className="dashboard-card">
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.9rem' }}>🔲 Confusion Matrices</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                    Prediction outcomes on training data (threshold: 50%)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {[
                      { label: 'KNN', color: '#6366f1' },
                      { label: 'Decision Tree', color: '#f59e0b' },
                      { label: 'Random Forest', color: '#22c55e' },
                    ].map(algo => (
                      <div key={algo.label}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: algo.color, marginBottom: 8 }}>
                          {algo.label}
                        </div>
                        <ConfusionMatrix
                          metrics={metrics.algorithms[algo.label]}
                          color={algo.color}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature Importance bars per algo */}
              <div className="dashboard-card">
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.9rem' }}>🔬 Feature Importance (Permutation Method)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Accuracy drop when each feature is randomly shuffled — higher means more important
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
                  {[
                    { label: 'KNN', color: '#6366f1' },
                    { label: 'Decision Tree', color: '#f59e0b' },
                    { label: 'Random Forest', color: '#22c55e' },
                  ].map(algo => (
                    <div key={algo.label}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: algo.color, marginBottom: 12 }}>
                        {algo.label}
                      </div>
                      <BarChart
                        key={algo.label}
                        data={featureImportanceData(algo.label).map(d => ({ ...d, color: algo.color }))}
                        valueFormatter={v => `${v}%`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary insight card */}
              <div style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(99,102,241,0.06))',
                border: '1px solid rgba(34,197,94,0.2)',
              }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '2.5rem' }}>💡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>Algorithm Insights</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>Random Forest</span> achieves the highest overall accuracy by averaging across 10 decision trees, reducing overfitting.{' '}
                      <span style={{ color: '#6366f1', fontWeight: 600 }}>KNN</span> uses inverse-distance weighted voting from 7 nearest neighbors in the synthetic training set — best for dense, well-distributed data.{' '}
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Decision Tree</span> applies explicit rule-based splits and is most interpretable.
                      All algorithms rank <strong>Budget Fit</strong> and <strong>Location</strong> as the top factors.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
