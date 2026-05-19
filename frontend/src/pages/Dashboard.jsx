import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBookings, getBookingStats } from '../api/bookings'

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

function StatCard({ label, value, sub, color = 'bg-white' }) {
  return (
    <div className={`${color} rounded-xl border border-gray-200 p-5 shadow-sm`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function formatTime(t) {
  return t ? t.slice(0, 5) : '—'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calls = [getBookings()]
    if (user?.role === 'admin') calls.push(getBookingStats())
    Promise.all(calls)
      .then(([bRes, sRes]) => {
        const list = Array.isArray(bRes.data) ? bRes.data : bRes.data.results ?? []
        setBookings(list)
        if (sRes) setStats(sRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'approved').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayTotal = bookings.filter((b) => b.date === today).length

  const recent = bookings.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your booking activity.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={counts.total} />
        <StatCard label="Pending" value={counts.pending} color="bg-yellow-50" />
        <StatCard label="Approved" value={counts.approved} color="bg-green-50" />
        <StatCard label="Cancelled" value={counts.cancelled} />
      </div>

      {/* Admin extra cards */}
      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Pending Approvals"
            value={stats.pending_count}
            sub={<Link to="/admin/bookings" className="text-indigo-600 hover:underline">Go to approval queue →</Link>}
            color="bg-orange-50"
          />
          <StatCard
            label="Approved Today"
            value={stats.approved_today}
            color="bg-indigo-50"
          />
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/bookings" className="text-sm text-indigo-600 hover:underline">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            No bookings yet.{' '}
            <Link to="/bookings/new" className="text-indigo-600 hover:underline">
              Make your first booking
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Venue', 'Date', 'Time', 'Purpose', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {b.venue_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{b.date}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600 capitalize">
                    {b.purpose_display ?? b.purpose}
                  </td>
                  <td className="px-5 py-3">
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
        )}
      </div>
    </div>
  )
}
