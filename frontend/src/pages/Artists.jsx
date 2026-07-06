import React, { useState, useEffect } from 'react'
import api from '../services/api'
import ArtistCard from '../components/ArtistCard'
import LoadingSpinner from '../components/LoadingSpinner'

const CITIES = ['All Cities', 'Udupi', 'Mangaluru', 'Dharwad', 'Bengaluru', 'Kundapur', 'Karwar', 'Sirsi', 'Honavar', 'Mysuru']
const STYLES = ['All Styles', 'Badagu Tittu', 'Tenkutittu', 'Both']
const SPECIALIZATIONS = ['All', 'Bhagavata', 'Veshadhara', 'Chande', 'Maddale', 'Odeyata']

export default function Artists() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All Cities')
  const [style, setStyle] = useState('All Styles')
  const [maxPrice, setMaxPrice] = useState(50000)
  const [minRating, setMinRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('rating')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchArtists = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (city !== 'All Cities') params.append('city', city)
      if (style !== 'All Styles') params.append('performance_style', style)
      if (maxPrice < 50000) params.append('max_price', maxPrice)
      if (minRating > 0) params.append('min_rating', minRating)
      if (verifiedOnly) params.append('is_verified', 'true')
      params.append('limit', 50)
      const res = await api.get(`/artists?${params}`)
      let data = res.data

      // Sort
      if (sortBy === 'rating') data.sort((a, b) => b.avg_rating - a.avg_rating)
      else if (sortBy === 'price_asc') data.sort((a, b) => a.pricing_per_event - b.pricing_per_event)
      else if (sortBy === 'price_desc') data.sort((a, b) => b.pricing_per_event - a.pricing_per_event)
      else if (sortBy === 'experience') data.sort((a, b) => b.experience_years - a.experience_years)

      setArtists(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArtists() }, [search, city, style, maxPrice, minRating, verifiedOnly, sortBy])

  const resetFilters = () => {
    setSearch('')
    setCity('All Cities')
    setStyle('All Styles')
    setMaxPrice(50000)
    setMinRating(0)
    setVerifiedOnly(false)
    setSortBy('rating')
  }

  const FilterPanel = () => (
    <div className="filter-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700 }}>Filters</h3>
        <button onClick={resetFilters} className="btn btn-ghost btn-sm">Reset</button>
      </div>

      {/* City */}
      <div className="filter-group">
        <div className="filter-group-label">City</div>
        <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Style */}
      <div className="filter-group">
        <div className="filter-group-label">Performance Style</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {STYLES.map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input type="radio" name="style" checked={style === s} onChange={() => setStyle(s)}
                style={{ accentColor: 'var(--color-gold)' }} />
              <span style={{ color: style === s ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Max Price */}
      <div className="filter-group">
        <div className="filter-group-label">Max Budget</div>
        <input type="range" min={5000} max={50000} step={1000}
          value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
          <span>₹5,000</span>
          <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>₹{maxPrice.toLocaleString('en-IN')}</span>
          <span>₹50,000</span>
        </div>
      </div>

      {/* Min Rating */}
      <div className="filter-group">
        <div className="filter-group-label">Minimum Rating</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[0, 3, 4, 4.5].map(r => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`btn btn-sm ${minRating === r ? 'btn-gold' : 'btn-ghost'}`}>
              {r === 0 ? 'All' : `${r}+★`}
            </button>
          ))}
        </div>
      </div>

      {/* Verified */}
      <div className="filter-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)}
            style={{ accentColor: 'var(--color-gold)', width: 16, height: 16 }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>Verified Artists Only</span>
        </label>
      </div>
    </div>
  )

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(196,30,58,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-10) 0 var(--space-6)',
      }}>
        <div className="container">
          <div className="section-subtitle">Discover</div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Yakshagana Artists</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Browse 500+ verified Yakshagana performers across Karnataka
          </p>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 500 }}>
            <span style={{ position: 'absolute', left: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, city, or specialization..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 'var(--space-10)' }}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 'var(--space-8)' }}>
          {/* Sidebar */}
          <div>
            <FilterPanel />
          </div>

          {/* Main Content */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                <strong style={{ color: 'var(--color-text)' }}>{artists.length}</strong> artists found
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sort by:</span>
                <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ width: 'auto', padding: 'var(--space-2) var(--space-4)' }}>
                  <option value="rating">Top Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : artists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎭</div>
                <h3 style={{ fontFamily: 'var(--font-body)', marginBottom: 'var(--space-3)' }}>No artists found</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Try adjusting your filters</p>
                <button onClick={resetFilters} className="btn btn-outline" style={{ marginTop: 'var(--space-4)' }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="artists-grid">
                {artists.map(artist => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
