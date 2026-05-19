import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllVenues } from '../api/venues'
import { useAuth } from '../context/AuthContext'

// ── helpers ──────────────────────────────────────────────────────────────────

const RECENT_KEY = 'vbs_recent_searches'
const MAX_RECENT = 5

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? [] } catch { return [] }
}

function saveRecent(term) {
  const prev = loadRecent().filter((s) => s !== term)
  localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)))
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY)
}

// ── icons ─────────────────────────────────────────────────────────────────────

function Ico({ d, className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  )
}

const D = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  venue:    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5',
  booking:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  plus:     'M12 4v16m8-8H4',
  user:     'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z',
  chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  table:    'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  arrow:    'M9 5l7 7-7 7',
  close:    'M6 18L18 6M6 6l12 12',
  x:        'M6 18L18 6M6 6l12 12',
  home:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
}

// ── quick actions per role ───────────────────────────────────────────────────

function getActions(role) {
  const base = [
    { label: 'Dashboard',    sub: 'Go to your dashboard',       icon: 'home',    to: '/dashboard' },
    { label: 'Browse Venues', sub: 'See all available venues',  icon: 'venue',   to: '/venues' },
    { label: 'My Bookings',  sub: 'View and manage bookings',   icon: 'booking', to: '/bookings' },
    { label: 'New Booking',  sub: 'Request a new venue',        icon: 'plus',    to: '/bookings/new' },
    { label: 'My Profile',   sub: 'View your account details',  icon: 'user',    to: '/profile' },
  ]
  const admin = [
    { label: 'Analytics',       sub: 'Admin charts & stats',       icon: 'chart',   to: '/admin/dashboard' },
    { label: 'Pending Approvals', sub: 'Review booking requests',  icon: 'check',   to: '/admin/bookings' },
    { label: 'Manage Venues',   sub: 'Add / edit venues',          icon: 'venue',   to: '/admin/venues' },
    { label: 'All Bookings',    sub: 'Full bookings table',        icon: 'table',   to: '/admin/reports' },
  ]
  return role === 'admin' ? [...base, ...admin] : base
}

// ── result row ───────────────────────────────────────────────────────────────

function Row({ icon, label, sub, badge, active, onClick }) {
  return (
    <button
      onMouseDown={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? 'bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
      }`}>
        <Ico d={D[icon] ?? D.search} className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium truncate ${active ? 'text-indigo-700' : 'text-gray-900'}`}>
          {label}
        </span>
        {sub && (
          <span className="block text-xs text-gray-400 truncate">{sub}</span>
        )}
      </span>
      {badge && (
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
          {badge}
        </span>
      )}
      {active && <Ico d={D.arrow} className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
    </button>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function SearchModal({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState(loadRecent)
  const [activeIdx, setActiveIdx] = useState(0)

  const actions = getActions(user?.role)

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Debounced venue search
  useEffect(() => {
    if (query.trim().length < 2) { setVenues([]); return }
    setLoading(true)
    const timer = setTimeout(() => {
      getAllVenues({ search: query.trim() })
        .then(({ data }) => {
          const list = Array.isArray(data) ? data : data.results ?? []
          setVenues(list.slice(0, 5))
        })
        .catch(() => setVenues([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Build the flat list of items shown
  const filteredActions = query.trim()
    ? actions.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.sub.toLowerCase().includes(query.toLowerCase())
      )
    : actions

  const venueItems = venues.map((v) => ({
    label: v.name,
    sub: `${v.location} · Cap. ${v.capacity}`,
    icon: 'venue',
    badge: v.venue_type?.replace('_', ' '),
    to: '/venues',
  }))

  const recentItems = !query.trim()
    ? recent.map((r) => ({ label: r, sub: 'Recent search', icon: 'clock', isRecent: true }))
    : []

  const allItems = [...recentItems, ...filteredActions, ...venueItems]

  useEffect(() => { setActiveIdx(0) }, [query])

  const go = useCallback((item) => {
    if (item.to) {
      if (query.trim()) saveRecent(query.trim())
      navigate(item.to)
      onClose()
    } else if (item.isRecent) {
      setQuery(item.label)
    }
  }, [navigate, onClose, query])

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allItems[activeIdx]) go(allItems[activeIdx])
    }
  }

  const handleClearRecent = (e) => {
    e.stopPropagation()
    clearRecent()
    setRecent([])
  }

  // Section indices for rendering
  const recentEnd   = recentItems.length
  const actionsEnd  = recentEnd + filteredActions.length
  const venuesStart = actionsEnd

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
        onMouseDown={onClose}
      >
        {/* Modal */}
        <div
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <Ico d={D.search} className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search venues, pages, actions…"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            />
            {loading && (
              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            {query && !loading && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <Ico d={D.x} className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {allItems.length === 0 && query.trim().length >= 2 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Ico d={D.search} className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm font-medium text-gray-500">No results for "{query}"</p>
                <p className="text-xs text-gray-400 mt-1">Try a venue name, location, or page name</p>
              </div>
            )}

            {/* Recent searches */}
            {recentItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recent</p>
                  <button
                    onMouseDown={handleClearRecent}
                    className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {recentItems.map((item, i) => (
                  <Row
                    key={`r-${i}`}
                    {...item}
                    active={activeIdx === i}
                    onClick={() => go(item)}
                  />
                ))}
              </div>
            )}

            {/* Quick actions */}
            {filteredActions.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {query.trim() ? 'Pages' : 'Quick actions'}
                </p>
                {filteredActions.map((item, i) => (
                  <Row
                    key={`a-${i}`}
                    {...item}
                    active={activeIdx === recentEnd + i}
                    onClick={() => go(item)}
                  />
                ))}
              </div>
            )}

            {/* Venue results */}
            {venueItems.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Venues
                </p>
                {venueItems.map((item, i) => (
                  <Row
                    key={`v-${i}`}
                    {...item}
                    active={activeIdx === venuesStart + i}
                    onClick={() => go(item)}
                  />
                ))}
              </div>
            )}

            {/* Empty state when no query */}
            {!query.trim() && recentItems.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                Start typing to search venues and pages
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-mono">↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-mono">Esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
