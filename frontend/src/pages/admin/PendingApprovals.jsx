import { useCallback, useEffect, useRef, useState } from 'react'
import { getPendingBookings, approveBooking, rejectBooking } from '../../api/bookings'
import toast from 'react-hot-toast'

function formatTime(t) {
  return t ? t.slice(0, 5) : '—'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PendingApprovals() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)
  const intervalRef = useRef(null)

  const load = useCallback(() => {
    getPendingBookings()
      .then(({ data }) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 60000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  const handleApprove = async (id, venueName) => {
    setApprovingId(id)
    try {
      await approveBooking(id)
      toast.success(`Booking for "${venueName}" approved.`)
      setBookings((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Approval failed.'
      toast.error(msg)
    } finally {
      setApprovingId(null)
    }
  }

  const openReject = (id) => {
    setRejectingId(id)
    setRejectReason('')
    setRejectError('')
  }

  const cancelReject = () => {
    setRejectingId(null)
    setRejectReason('')
    setRejectError('')
  }

  const handleReject = async (id, venueName) => {
    if (!rejectReason.trim()) {
      setRejectError('Please enter a rejection reason before confirming.')
      return
    }
    setSubmittingReject(true)
    try {
      await rejectBooking(id, rejectReason.trim())
      toast.success(`Booking for "${venueName}" rejected.`)
      setBookings((prev) => prev.filter((b) => b.id !== id))
      cancelReject()
    } catch (err) {
      const data = err.response?.data
      const msg =
        data?.rejection_reason?.[0] ??
        data?.detail ??
        'Rejection failed.'
      toast.error(msg)
    } finally {
      setSubmittingReject(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Booking Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Auto-refreshes every 60 seconds. {bookings.length > 0 && (
              <span className="font-medium text-indigo-600">{bookings.length} pending.</span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-gray-200 shadow-sm gap-2">
          <span className="text-4xl">🎉</span>
          <p className="text-gray-600 font-medium">No pending bookings. All caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Student', 'Email', 'Venue', 'Date', 'Time',
                    'Purpose', 'Attendees', 'Submitted', 'Actions',
                  ].map((h) => (
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
                {bookings.map((b) => (
                  <>
                    <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${rejectingId === b.id ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {b.user_full_name}
                        {b.user_role !== 'student' && (
                          <span className="ml-1 text-xs text-gray-400">({b.user_role})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {b.user_email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        <p className="font-medium">{b.venue_name}</p>
                        <p className="text-xs text-gray-400">{b.venue_location}</p>
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
                        {b.expected_attendees}
                        <span className="block text-xs text-gray-400">/ {b.venue_capacity}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(b.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(b.id, b.venue_name)}
                            disabled={approvingId === b.id || rejectingId === b.id}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {approvingId === b.id ? '…' : 'Approve'}
                          </button>
                          {rejectingId === b.id ? (
                            <button
                              onClick={cancelReject}
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              onClick={() => openReject(b.id)}
                              disabled={approvingId === b.id}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline rejection form — expands below the row */}
                    {rejectingId === b.id && (
                      <tr key={`reject-${b.id}`} className="bg-red-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="max-w-xl space-y-2">
                            <p className="text-sm font-medium text-red-700">
                              Rejection reason for <strong>{b.venue_name}</strong> on {b.date}
                            </p>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => {
                                setRejectReason(e.target.value)
                                if (e.target.value.trim()) setRejectError('')
                              }}
                              rows={3}
                              placeholder="e.g. Venue reserved for faculty use on that date."
                              className="block w-full rounded-lg border-gray-300 text-sm focus:ring-red-500 focus:border-red-500"
                              autoFocus
                            />
                            {rejectError && (
                              <p className="text-xs text-red-600">{rejectError}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(b.id, b.venue_name)}
                                disabled={submittingReject}
                                className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {submittingReject ? 'Rejecting…' : 'Confirm Rejection'}
                              </button>
                              <button
                                onClick={cancelReject}
                                className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
