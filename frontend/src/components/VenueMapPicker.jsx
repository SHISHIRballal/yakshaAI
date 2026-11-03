import React, { useState, useEffect, useRef } from 'react'

const KARNATAKA_PRESETS = [
  { name: 'Udupi (Krishna Matha)', city: 'Udupi', lat: 13.3409, lng: 74.7421 },
  { name: 'Mangaluru (Kadri)', city: 'Mangaluru', lat: 12.8703, lng: 74.8560 },
  { name: 'Dharmasthala', city: 'Dharmasthala', lat: 12.9567, lng: 75.3800 },
  { name: 'Kateel (Durgaparameshwari)', city: 'Kateel', lat: 13.0189, lng: 74.8519 },
  { name: 'Kundapur', city: 'Kundapur', lat: 13.6268, lng: 74.6917 },
  { name: 'Sirsi', city: 'Sirsi', lat: 14.6195, lng: 74.8354 },
  { name: 'Bengaluru (Ravindra Kalakshetra)', city: 'Bengaluru', lat: 12.9629, lng: 77.5855 },
]

export default function VenueMapPicker({
  selectedVenue = '',
  selectedCity = '',
  mapLink = '',
  onLocationSelect,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [currentCoords, setCurrentCoords] = useState(null)
  const [locatingUser, setLocatingUser] = useState(false)

  // Ensure Leaflet is loaded
  useEffect(() => {
    let isMounted = true

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initMap = () => {
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return
      const L = window.L
      if (!L) return

      // Default center: Coastal Karnataka
      const defaultLat = 13.3409
      const defaultLng = 74.7421

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([defaultLat, defaultLng], 8)

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Ensure proper container size calculations
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 250)

      map.on('click', (e) => {
        handleCoordinatesSelected(e.latlng.lat, e.latlng.lng)
      })
    }

    if (window.L) {
      initMap()
    } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => {
        if (isMounted) initMap()
      }
      document.head.appendChild(script)
    }

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Create custom pin icon
  const getPinIcon = () => {
    const L = window.L
    if (!L) return null
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #C41E3A, #D4AF37);
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 14px;">🎭</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32],
    })
  }

  // Handle setting pin and reverse geocoding
  const handleCoordinatesSelected = async (lat, lng, presetName = null, presetCity = null) => {
    const L = window.L
    if (!L || !mapInstanceRef.current) return

    setCurrentCoords({ lat, lng })
    const map = mapInstanceRef.current
    const icon = getPinIcon()

    if (markerRef.current) {
      markerRef.current.remove()
    }

    markerRef.current = L.marker([lat, lng], icon ? { icon } : {}).addTo(map)

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

    if (presetName) {
      onLocationSelect?.({
        venue: presetName,
        venue_city: presetCity || '',
        venue_map_link: mapLink,
        lat,
        lng,
      })
      markerRef.current
        .bindPopup(`<strong>${presetName}</strong><br/>${presetCity || ''}<br/><a href="${mapLink}" target="_blank" rel="noopener noreferrer" style="color: #c41e3a; font-weight: bold;">View in Google Maps</a>`)
        .openPopup()
      return
    }

    // Reverse geocode via OpenStreetMap Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      const addr = data.address || {}

      const venueName = [
        addr.amenity || addr.building || addr.leisure || addr.tourism || addr.temple,
        addr.road,
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village,
      ]
        .filter(Boolean)
        .join(', ')

      const city = addr.city || addr.town || addr.village || addr.county || ''
      const finalVenue = venueName || data.display_name?.split(',').slice(0, 3).join(',') || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`

      onLocationSelect?.({
        venue: finalVenue,
        venue_city: city,
        venue_map_link: mapLink,
        lat,
        lng,
      })

      markerRef.current
        .bindPopup(`<strong>${finalVenue}</strong><br/>${city}<br/><a href="${mapLink}" target="_blank" rel="noopener noreferrer" style="color: #c41e3a; font-weight: 600;">View in Google Maps</a>`)
        .openPopup()
    } catch {
      const fallbackName = `Venue at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      onLocationSelect?.({
        venue: fallbackName,
        venue_city: '',
        venue_map_link: mapLink,
        lat,
        lng,
      })
    }
  }

  // Search location
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchError('')

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery + ' Karnataka India'
        )}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results = await res.json()

      if (results && results.length > 0) {
        const top = results[0]
        const lat = parseFloat(top.lat)
        const lng = parseFloat(top.lon)

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 })
          handleCoordinatesSelected(lat, lng)
        }
      } else {
        setSearchError('Place not found. Try another landmark or click directly on the map.')
      }
    } catch {
      setSearchError('Search failed. Please click directly on the map.')
    } finally {
      setSearching(false)
    }
  }

  // Quick preset click
  const selectPreset = (preset) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 14, { duration: 1.0 })
      handleCoordinatesSelected(preset.lat, preset.lng, preset.name, preset.city)
    }
  }

  // Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false)
        const { latitude, longitude } = pos.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.0 })
          handleCoordinatesSelected(latitude, longitude)
        }
      },
      () => {
        setLocatingUser(false)
        alert('Could not retrieve your current location. Please pick on the map.')
      },
      { timeout: 8000 }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Search Bar & My Location */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, minWidth: 260 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search temple, hall, town, or landmark (e.g. Kateel, Rajangana)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn btn-secondary btn-sm" disabled={searching}>
            {searching ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleUseMyLocation}
          disabled={locatingUser}
          title="Use my current GPS position"
          style={{ whiteSpace: 'nowrap' }}
        >
          {locatingUser ? '📍 Locating...' : '🎯 My Location'}
        </button>
      </div>

      {searchError && (
        <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>{searchError}</div>
      )}

      {/* Popular Cultural Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
          Quick Hubs:
        </span>
        {KARNATAKA_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => selectPreset(p)}
            style={{
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-gold)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-gold)'
              e.currentTarget.style.background = 'rgba(212,175,55,0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.background = 'var(--color-surface-2)'
            }}
          >
            📍 {p.city}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          height: 340,
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-border)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
        }}
      />

      {/* Selection Feedback Card */}
      {selectedVenue && (
        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold)' }}>
              📍 Selected Venue: {selectedVenue}
            </div>
            {selectedCity && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                City: {selectedCity} {currentCoords && `(${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)})`}
              </div>
            )}
          </div>

          {mapLink && (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
            >
              🗺️ Open in Google Maps ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
