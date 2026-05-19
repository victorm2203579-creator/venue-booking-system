import { useEffect, useState } from 'react'
import { getNotifications, markRead, markAllRead } from '../api/notifications'
import toast from 'react-hot-toast'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

const TYPE_ICON = {
  booking_submitted: '📥',
  booking_approved: '✅',
  booking_rejected: '❌',
  booking_cancelled: '🚫',
  admin_alert: '🔔',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = () => {
    setLoading(true)
    getNotifications()
      .then(({ data }) => setNotifications(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleMarkRead = async (n) => {
    if (n.is_read) return
    try {
      await markRead(n.id)
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      )
    } catch {
      // silent
    }
  }

  const handleMarkAll = async () => {
    setMarking(true)
    try {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read.')
    } catch {
      toast.error('Failed to mark all as read.')
    } finally {
      setMarking(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={marking}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {marking ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleMarkRead(n)}
              className={`w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                !n.is_read ? 'bg-indigo-50/40' : ''
              }`}
            >
              {/* Unread dot */}
              <div className="mt-1 shrink-0 w-2 h-2 rounded-full">
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
              </div>

              {/* Icon */}
              <span className="text-xl shrink-0 leading-none">
                {TYPE_ICON[n.notification_type] ?? '🔔'}
              </span>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    n.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
                  }`}
                >
                  {n.message}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  <span>{timeAgo(n.created_at)}</span>
                  {n.venue_name && (
                    <>
                      <span>·</span>
                      <span>{n.venue_name}</span>
                    </>
                  )}
                  {n.booking_date && (
                    <>
                      <span>·</span>
                      <span>{n.booking_date}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Read badge */}
              {n.is_read && (
                <span className="shrink-0 text-xs text-gray-300 self-center">Read</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
