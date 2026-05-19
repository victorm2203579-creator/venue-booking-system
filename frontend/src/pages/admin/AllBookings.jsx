import { useEffect, useState, useMemo } from 'react'
import { getBookings } from '../../api/bookings'
import { getAllVenues } from '../../api/venues'

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatTime(t) {
  return t ? t.slice(0, 5) : '—'
}

function escapeCSVField(val) {
  if (val == null) return ''
  const str = String(val)
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

function downloadCSV(bookings) {
  const headers = [
    'User', 'Email', 'Venue', 'Date',
    'Start Time', 'End Time', 'Purpose',
    'Attendees', 'Status', 'Submitted At',
  ]
  const rows = bookings.map((b) => [
    b.user_full_name,
    b.user_email,
    b.venue_name,
    b.date,
    formatTime(b.start_time),
    formatTime(b.end_time),
    b.purpose_display ?? b.purpose,
    b.expected_attendees,
    b.status_display ?? b.status,
    b.created_at,
  ].map(escapeCSVField))

  const csv = [headers, ...rows].map((r) => r.join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AllBookings() {
  const [bookings, setBookings] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [venueFilter, setVenueFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    Promise.all([getBookings(), getAllVenues()])
      .then(([bRes, vRes]) => {
        setBookings(Array.isArray(bRes.data) ? bRes.data : bRes.data.results ?? [])
        setVenues(Array.isArray(vRes.data) ? vRes.data : vRes.data.results ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false
      if (venueFilter && b.venue_name !== venueFilter) return false
      if (fromDate && b.date < fromDate) return false
      if (toDate && b.date > toDate) return false
      return true
    })
  }, [bookings, statusFilter, venueFilter, fromDate, toDate])

  const clearFilters = () => {
    setStatusFilter('')
    setVenueFilter('')
    setFromDate('')
    setToDate('')
  }

  const hasFilters = statusFilter || venueFilter || fromDate || toDate

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Loading…' : `${filtered.length} of ${bookings.length} bookings`}
          </p>
        </div>
        <button
          onClick={() => downloadCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Venue</label>
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Venues</option>
            {venues.map((v) => (
              <option key={v.id} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="self-end text-sm text-gray-500 hover:text-red-600 pb-1 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            No bookings match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Email', 'Venue', 'Date', 'Time', 'Purpose', 'Attendees', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {b.user_full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {b.user_email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {b.venue_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {b.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatTime(b.start_time)} – {formatTime(b.end_time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize whitespace-nowrap">
                      {b.purpose_display ?? b.purpose}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {b.expected_attendees ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {b.status_display ?? b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
