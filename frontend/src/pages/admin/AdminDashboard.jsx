import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import {
  getReportSummary,
  getVenueUtilization,
  getBusiestSlots,
  getMonthlyTrend,
  getTopUsers,
} from '../../api/reports'

// ── helpers ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'bg-white' }) {
  return (
    <div className={`${color} rounded-xl border border-gray-200 p-5 shadow-sm`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-base font-semibold text-gray-900 mb-3">{children}</h2>
  )
}

// ── Heatmap row ────────────────────────────────────────────────────────────

function HourHeatmap({ slots }) {
  const max = Math.max(...slots.map((s) => s.booking_count), 1)
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {slots.map((s) => {
          const intensity = max > 0 ? s.booking_count / max : 0
          return (
            <div
              key={s.hour}
              title={`${s.hour}  —  ${s.booking_count} booking${s.booking_count !== 1 ? 's' : ''}`}
              className="flex flex-col items-center gap-1 cursor-default"
            >
              <div
                className="w-8 h-8 rounded"
                style={{
                  backgroundColor:
                    intensity === 0
                      ? '#f1f5f9'
                      : `rgba(79, 70, 229, ${0.15 + intensity * 0.85})`,
                }}
              />
              <span className="text-[9px] text-gray-400 w-8 text-center leading-none">
                {s.hour.slice(0, 2)}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Hover a cell for count. Darker = busier.
      </p>
    </div>
  )
}

// ── Truncate long venue names for chart axis ────────────────────────────────

function shortName(name) {
  return name.length > 18 ? name.slice(0, 16) + '…' : name
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [weekSummary, setWeekSummary] = useState(null)
  const [todaySummary, setTodaySummary] = useState(null)
  const [utilization, setUtilization] = useState([])
  const [slots, setSlots] = useState([])
  const [trend, setTrend] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getReportSummary('week'),
      getReportSummary('today'),
      getVenueUtilization(),
      getBusiestSlots(),
      getMonthlyTrend(),
      getTopUsers(5),
    ])
      .then(([wRes, tRes, uRes, sRes, mRes, uuRes]) => {
        setWeekSummary(wRes.data)
        setTodaySummary(tRes.data)
        setUtilization(uRes.data)
        setSlots(sRes.data)
        setTrend(mRes.data)
        setTopUsers(uuRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading analytics…
      </div>
    )
  }

  const top5Venues = [...utilization]
    .sort((a, b) => b.total_bookings - a.total_bookings)
    .slice(0, 5)
    .map((v) => ({ ...v, shortName: shortName(v.venue_name) }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Link
          to="/admin/bookings"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Review Pending →
        </Link>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings (this week)"
          value={weekSummary?.total_bookings}
        />
        <StatCard
          label="Pending Today"
          value={todaySummary?.pending}
          color="bg-yellow-50"
        />
        <StatCard
          label="Approved This Week"
          value={weekSummary?.approved}
          color="bg-green-50"
        />
        <StatCard
          label="Rejected This Week"
          value={weekSummary?.rejected}
          color="bg-red-50"
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Bar chart — top 5 venues */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <SectionTitle>Top 5 Most Booked Venues (last 30 days)</SectionTitle>
          {top5Venues.length === 0 ? (
            <p className="text-sm text-gray-400">No booking data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top5Venues} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Total bookings']}
                  labelFormatter={(l, payload) =>
                    payload?.[0]?.payload?.venue_name ?? l
                  }
                />
                <Bar dataKey="total_bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart — monthly trend */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <SectionTitle>Booking Trend — Last 6 Months</SectionTitle>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-400">No data in the last 6 months.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Approved"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Heatmap ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <SectionTitle>Busiest Time Slots (approved bookings by start hour)</SectionTitle>
        {slots.length === 0 ? (
          <p className="text-sm text-gray-400">No approved bookings yet.</p>
        ) : (
          <HourHeatmap slots={slots} />
        )}
      </div>

      {/* ── Top Users ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <SectionTitle>Top 5 Users by Approved Bookings</SectionTitle>
        </div>
        {topUsers.length === 0 ? (
          <div className="px-5 py-8 text-sm text-gray-400">
            No approved bookings recorded yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Name', 'Email', 'Role', 'Approved'].map((h) => (
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
              {topUsers.map((u, i) => (
                <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 capitalize">{u.role}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {u.approved_count}
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
