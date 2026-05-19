import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getBookings, cancelBooking } from '../api/bookings'
import toast from 'react-hot-toast'

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

export default function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (statusFilter) params.status = statusFilter
    getBookings(params)
      .then(({ data }) => setBookings(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleCancel = async (booking) => {
    const confirmed = window.confirm(
      `Cancel booking at "${booking.venue_name}" on ${booking.date}?\n\nThis cannot be undone.`
    )
    if (!confirmed) return

    setCancelling(booking.id)
    try {
      await cancelBooking(booking.id)
      toast.success('Booking cancelled.')
      load()
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Could not cancel booking.'
      toast.error(msg)
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link
          to="/bookings/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + New Booking
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <p>No bookings found.</p>
            <Link to="/bookings/new" className="text-indigo-600 hover:underline text-sm">
              Make a booking →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Venue', 'Date', 'Time', 'Purpose', 'Attendees', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {b.venue_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{b.date}</td>
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
                      {b.status === 'rejected' && b.rejection_reason && (
                        <p className="mt-1 text-xs text-red-500 max-w-xs">{b.rejection_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {b.status === 'approved' && (
                          <button
                            onClick={() => navigate(`/bookings/${b.id}/pass`)}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                          >
                            View Slip
                          </button>
                        )}
                        {(b.status === 'pending' || b.status === 'approved') && (
                          <button
                            onClick={() => handleCancel(b)}
                            disabled={cancelling === b.id}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {cancelling === b.id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        )}
                      </div>
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
