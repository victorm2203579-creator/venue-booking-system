import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllVenues } from '../api/venues'

const VENUE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'lecture_hall', label: 'Lecture Hall' },
  { value: 'seminar_room', label: 'Seminar Room' },
  { value: 'lab', label: 'Lab' },
  { value: 'event_center', label: 'Event Center' },
  { value: 'conference_room', label: 'Conference Room' },
  { value: 'sports_hall', label: 'Sports Hall' },
  { value: 'other', label: 'Other' },
]

const TYPE_BADGE = {
  lecture_hall: 'bg-blue-100 text-blue-800',
  seminar_room: 'bg-purple-100 text-purple-800',
  lab: 'bg-green-100 text-green-800',
  event_center: 'bg-orange-100 text-orange-800',
  conference_room: 'bg-indigo-100 text-indigo-800',
  sports_hall: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800',
}

const TYPE_LABEL = Object.fromEntries(
  VENUE_TYPES.slice(1).map(({ value, label }) => [value, label])
)

export default function Venues() {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [venueType, setVenueType] = useState('')
  const [minCapacity, setMinCapacity] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = { is_active: true }
    if (venueType) params.venue_type = venueType
    if (minCapacity) params.min_capacity = minCapacity
    if (debouncedSearch) params.search = debouncedSearch

    getAllVenues(params)
      .then(({ data }) => {
        setVenues(Array.isArray(data) ? data : data.results ?? [])
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false))
  }, [venueType, minCapacity, debouncedSearch])

  const handleBook = (venue) => {
    navigate('/bookings/new', { state: { venueId: venue.id, venueName: venue.name } })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Available Venues</h1>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, location…"
          className="flex-1 min-w-45 rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select
          value={venueType}
          onChange={(e) => setVenueType(e.target.value)}
          className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          {VENUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="number"
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
          placeholder="Min capacity"
          min={1}
          className="w-36 rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        {(search || venueType || minCapacity) && (
          <button
            onClick={() => { setSearch(''); setVenueType(''); setMinCapacity('') }}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
      ) : venues.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          No venues match your filters.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 leading-tight">{venue.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{venue.location}</p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    TYPE_BADGE[venue.venue_type] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {TYPE_LABEL[venue.venue_type] ?? venue.venue_type}
                </span>
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <span>👥</span>
                <span>{venue.capacity} people</span>
              </div>

              {/* Facilities */}
              {venue.facilities && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {venue.facilities}
                </p>
              )}

              {/* Description */}
              {venue.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{venue.description}</p>
              )}

              {/* Action */}
              <button
                onClick={() => handleBook(venue)}
                className="mt-auto w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Book This Venue
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
