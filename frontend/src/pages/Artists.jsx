import React, { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import ArtistCard from '../components/ArtistCard'
import LoadingSpinner from '../components/LoadingSpinner'

const CITIES = ['All Cities', 'Udupi', 'Mangaluru', 'Dharwad', 'Bengaluru', 'Kundapur', 'Karwar', 'Sirsi', 'Honavar', 'Mysuru']
const STYLES = ['All Styles', 'Badagu Tittu', 'Tenkutittu', 'Both']

export default function Artists() {
  const [artists, setArtists] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  // Filter states
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All Cities')
  const [style, setStyle] = useState('All Styles')
  const [maxPrice, setMaxPrice] = useState(50000)
  const [minRating, setMinRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('rating')

  const observerRef = useRef(null)

  const buildParams = useCallback((cursor = null) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (city !== 'All Cities') params.append('city', city)
    if (style !== 'All Styles') params.append('performance_style', style)
    if (maxPrice < 50000) params.append('max_price', maxPrice)
    if (minRating > 0) params.append('min_rating', minRating)
    if (verifiedOnly) params.append('is_verified', 'true')
    params.append('limit', '10')
    if (cursor) params.append('cursor', cursor)
    return params
  }, [search, city, style, maxPrice, minRating, verifiedOnly])

  // Initial load & Filter change reset
  const loadInitialData = useCallback(async () => {
    setLoadingInitial(true)
    setError(null)
    setArtists([])
    setNextCursor(null)
    setHasMore(true)

    try {
      const params = buildParams(null)
      const res = await api.get(`/artists?${params}`)
      const payload = res.data

      let fetchedItems = Array.isArray(payload) ? payload : (payload.items || [])
      let cursor = payload.next_cursor || null
      let more = payload.has_more !== undefined ? payload.has_more : false

      // Optional client-side sort
      if (sortBy === 'rating') fetchedItems.sort((a, b) => b.avg_rating - a.avg_rating)
      else if (sortBy === 'price_asc') fetchedItems.sort((a, b) => a.pricing_per_event - b.pricing_per_event)
      else if (sortBy === 'price_desc') fetchedItems.sort((a, b) => b.pricing_per_event - a.pricing_per_event)
      else if (sortBy === 'experience') fetchedItems.sort((a, b) => b.experience_years - a.experience_years)

      setArtists(fetchedItems)
      setNextCursor(cursor)
      setHasMore(more)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load artists. Please try again.')
    } finally {
      setLoadingInitial(false)
    }
  }, [buildParams, sortBy])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Load next page
  const loadNextPage = useCallback(async () => {
    if (!hasMore || loadingMore || loadingInitial || !nextCursor) return

    setLoadingMore(true)
    setError(null)

    try {
      const params = buildParams(nextCursor)
      const res = await api.get(`/artists?${params}`)
      const payload = res.data

      let newItems = Array.isArray(payload) ? payload : (payload.items || [])
      let cursor = payload.next_cursor || null
      let more = payload.has_more !== undefined ? payload.has_more : false

      setArtists((prev) => {
        const existingIds = new Set(prev.map((a) => a.id))
        const filteredNew = newItems.filter((a) => !existingIds.has(a.id))
        const combined = [...prev, ...filteredNew]

        if (sortBy === 'rating') combined.sort((a, b) => b.avg_rating - a.avg_rating)
        else if (sortBy === 'price_asc') combined.sort((a, b) => a.pricing_per_event - b.pricing_per_event)
        else if (sortBy === 'price_desc') combined.sort((a, b) => b.pricing_per_event - a.pricing_per_event)
        else if (sortBy === 'experience') combined.sort((a, b) => b.experience_years - a.experience_years)

        return combined
      })

      setNextCursor(cursor)
      setHasMore(more)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load more artists.')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, loadingInitial, nextCursor, buildParams, sortBy])

  // IntersectionObserver callback for sentinel element
  const lastElementRef = useCallback(
    (node) => {
      if (loadingInitial || loadingMore) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadNextPage()
        }
      }, { threshold: 0.5 })

      if (node) observerRef.current.observe(node)
    },
    [loadingInitial, loadingMore, hasMore, loadNextPage]
  )

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

      {/* Verified Only */}
      <div className="filter-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)}
            style={{ accentColor: 'var(--color-gold)' }} />
          <span>Verified Artists Only</span>
        </label>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-8) 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
            Discover Yakshagana Artists
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Browse verified performers, Bhagavatas, and troupe artists across Karnataka
          </p>

          <div style={{ position: 'relative', maxWidth: 600 }}>
            <span style={{ position: 'absolute', left: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by artist name, specialization, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
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
                Showing <strong style={{ color: 'var(--color-text)' }}>{artists.length}</strong> artists
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

            {loadingInitial ? (
              <LoadingSpinner label="Loading artist feed..." />
            ) : artists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎭</div>
                <h3 style={{ fontFamily: 'var(--font-body)', marginBottom: 'var(--space-3)' }}>No artists found</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Try adjusting your search or filters</p>
                <button onClick={resetFilters} className="btn btn-outline" style={{ marginTop: 'var(--space-4)' }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="artists-grid">
                  {artists.map((artist, idx) => {
                    const isLast = idx === artists.length - 1
                    return (
                      <div ref={isLast ? lastElementRef : null} key={artist.id}>
                        <ArtistCard artist={artist} />
                      </div>
                    )
                  })}
                </div>

                {/* Loading More Indicator */}
                {loadingMore && (
                  <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                    <LoadingSpinner label="Loading more artists..." />
                  </div>
                )}

                {/* Error State with Retry Button */}
                {error && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: '#ef4444' }}>
                    <p>{error}</p>
                    <button onClick={loadNextPage} className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                      🔄 Retry Loading
                    </button>
                  </div>
                )}

                {/* End of Feed Indicator */}
                {!hasMore && artists.length > 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    🎉 You've reached the end of the artist directory.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
