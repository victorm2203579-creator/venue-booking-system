import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from '../api/notifications'
import SearchModal from './SearchModal'
import toast from 'react-hot-toast'

// ── SVG icons ───────────────────────────────────────────────────────────────

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
)

const Icons = {
  home:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  venues:   'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  bookings: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  newBook:  'M12 4v16m8-8H4',
  profile:  'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  chartBar: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  manage:   'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  pending:  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  allBooks: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  close:    'M6 18L18 6M6 6l12 12',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  chevronL: 'M15 19l-7-7 7-7',
  chevronR: 'M9 5l7 7-7 7',
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
}

const ROLE_COLORS = {
  admin:   'bg-red-500/20 text-red-300 ring-1 ring-red-500/30',
  staff:   'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
  student: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30',
}

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ to, label, iconKey, end: endProp, collapsed }) {
  return (
    <NavLink
      to={to}
      end={endProp}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
        }`
      }
    >
      <Icon d={Icons[iconKey]} className="w-5 h-5 shrink-0" />
      {!collapsed && label}
    </NavLink>
  )
}

// ── Notification panel ───────────────────────────────────────────────────────

function NotificationPanel({ onClose, unread, onUnreadChange }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications()
      .then(({ data }) => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleMarkOne = async (id) => {
    try {
      await markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      onUnreadChange((c) => Math.max(0, c - 1))
    } catch {}
  }

  const handleMarkAll = async () => {
    try {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      onUnreadChange(0)
    } catch {}
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-40 w-96 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon d={Icons.bell} className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
            {unread > 0 && (
              <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold px-1.5">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Icon d={Icons.close} className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <Icon d={Icons.bell} className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkOne(n.id)}
                  className={`w-full text-left px-5 py-4 transition-colors ${
                    !n.is_read ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        !n.is_read ? 'bg-indigo-500' : 'bg-transparent'
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm leading-snug ${
                          !n.is_read ? 'font-semibold text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Layout ───────────────────────────────────────────────────────────────────

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const sidebarW = collapsed ? 'w-16' : 'w-64'
  const mainML  = collapsed ? 'ml-16' : 'ml-64'

  useEffect(() => {
    const poll = () =>
      getUnreadCount().then(({ data }) => setUnread(data.unread_count)).catch(() => {})
    poll()
    const id = setInterval(poll, 30000)
    return () => clearInterval(id)
  }, [])

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 ${sidebarW} bg-gray-950 flex flex-col z-20 transition-all duration-200`}
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center border-b border-white/5 ${collapsed ? 'justify-center px-2 py-5' : 'justify-between px-5 py-6'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">VenueBook</p>
                <p className="text-indigo-400 text-[10px] font-medium tracking-widest uppercase mt-0.5">
                  University System
                </p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              className="p-1 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              <Icon d={Icons.chevronL} className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Main
            </p>
          )}
          <NavItem to="/dashboard"   iconKey="home"     label="Dashboard"   collapsed={collapsed} />
          <NavItem to="/venues"      iconKey="venues"   label="Venues"      collapsed={collapsed} />
          <NavItem to="/bookings"    iconKey="bookings" label="My Bookings" collapsed={collapsed} end />
          <NavItem to="/bookings/new" iconKey="newBook" label="New Booking" collapsed={collapsed} />
          <NavItem to="/profile"     iconKey="profile"  label="Profile"     collapsed={collapsed} />

          {user?.role === 'admin' && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    Administration
                  </p>
                </div>
              )}
              {collapsed && <div className="my-2 border-t border-white/5" />}
              <NavItem to="/admin/dashboard" iconKey="chartBar" label="Analytics"      collapsed={collapsed} />
              <NavItem to="/admin/venues"    iconKey="manage"   label="Manage Venues"  collapsed={collapsed} />
              <NavItem to="/admin/bookings"  iconKey="pending"  label="Approvals"      collapsed={collapsed} />
              <NavItem to="/admin/reports"   iconKey="allBooks" label="All Bookings"   collapsed={collapsed} />
            </>
          )}
        </nav>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="px-2 pb-2">
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="w-full flex items-center justify-center py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              <Icon d={Icons.chevronR} className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User footer */}
        <div className={`border-t border-white/5 ${collapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={user?.full_name}
                className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Icon d={Icons.logout} className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate leading-none">{user?.full_name}</p>
                  <p className="text-gray-500 text-[11px] truncate mt-0.5">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors py-1"
              >
                <Icon d={Icons.logout} className="w-3.5 h-3.5" />
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`${mainML} flex-1 flex flex-col min-h-screen transition-all duration-200`}>
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          {/* Centre — search trigger */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors text-sm w-full max-w-xs"
            >
              <Icon d={Icons.search} className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left text-sm text-gray-400">Search venues, pages…</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Bell */}
            <button
              onClick={() => setPanelOpen(true)}
              className="relative p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              aria-label="Notifications"
            >
              <Icon d={Icons.bell} className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* User chip */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.full_name}</p>
                <p
                  className={`text-[10px] font-semibold capitalize mt-0.5 px-1.5 py-0 rounded-full inline-block ${
                    ROLE_COLORS[user?.role] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Notification slide-out */}
      {panelOpen && (
        <NotificationPanel
          onClose={() => setPanelOpen(false)}
          unread={unread}
          onUnreadChange={setUnread}
        />
      )}

      {/* Global search */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
