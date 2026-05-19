import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBookings } from '../api/bookings'

const ROLE_COLORS = {
  admin:   'bg-red-100 text-red-700',
  staff:   'bg-emerald-100 text-emerald-700',
  student: 'bg-blue-100 text-blue-700',
}

const STAT_COLORS = [
  { label: 'Total Bookings',  key: 'total',     color: 'text-gray-900',    bg: 'bg-gray-50',     border: 'border-gray-200' },
  { label: 'Approved',        key: 'approved',  color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
  { label: 'Pending',         key: 'pending',   color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100' },
  { label: 'Declined',        key: 'declined',  color: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-100' },
]

export default function Profile() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    getBookings()
      .then(({ data }) => {
        setStats({
          total:    data.length,
          approved: data.filter((b) => b.status === 'approved').length,
          pending:  data.filter((b) => b.status === 'pending').length,
          declined: data.filter((b) => b.status === 'rejected' || b.status === 'cancelled').length,
        })
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [])

  const initials = user?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  const joinedDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  const details = [
    { label: 'Full name',    value: user?.full_name },
    { label: 'Email',        value: user?.email },
    { label: 'Role',         value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
    ...(user?.matric_number ? [{ label: 'Matric number', value: user.matric_number }] : []),
    { label: 'Member since', value: joinedDate },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-500" />
        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-4 ring-white shadow-lg">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${ROLE_COLORS[user?.role] ?? 'bg-gray-100 text-gray-700'}`}>
              {user?.role}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900">{user?.full_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>

          {user?.matric_number && (
            <p className="text-xs text-gray-400 mt-1">
              Matric &bull; {user.matric_number}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-1">Joined {joinedDate}</p>
        </div>
      </div>

      {/* Booking stats */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Booking Summary
        </h2>
        {loadingStats ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAT_COLORS.map((s) => (
              <div
                key={s.key}
                className={`${s.bg} rounded-xl px-4 py-4 border ${s.border}`}
              >
                <p className={`text-2xl font-bold ${s.color}`}>
                  {stats?.[s.key] ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Account Details
        </h2>
        <dl className="divide-y divide-gray-50">
          {details.map((d) => (
            <div key={d.label} className="flex justify-between items-center py-3">
              <dt className="text-sm text-gray-500">{d.label}</dt>
              <dd className="text-sm font-medium text-gray-900 text-right">{d.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
