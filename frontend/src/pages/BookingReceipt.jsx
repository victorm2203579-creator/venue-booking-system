import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBookingById } from '../api/bookings'
import { useAuth } from '../context/AuthContext'

// ── helpers ──────────────────────────────────────────────────────────────────

function shortRef(id) {
  return id?.replace(/-/g, '').slice(0, 8).toUpperCase() ?? '—'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(t) {
  return t ? t.slice(0, 5) : '—'
}

function formatStamp(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

// Combine "2026-05-19" + "11:00:00" into a Date object (local time)
function bookingDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`)
}

function getExpiry(booking) {
  if (!booking?.date || !booking?.end_time) return null
  const end = bookingDateTime(booking.date, booking.end_time)
  return new Date(end.getTime() + 3 * 60 * 1000) // +3 minutes
}

function formatCountdown(ms) {
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m remaining`
  if (m > 0) return `${m}m ${s}s remaining`
  return `${s}s remaining`
}

function formatValidUntil(expiry) {
  if (!expiry) return '—'
  return expiry.toLocaleString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── component ─────────────────────────────────────────────────────────────────

export default function BookingReceipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    getBookingById(id)
      .then(({ data }) => {
        if (data.status !== 'approved') {
          navigate('/bookings', { replace: true })
          return
        }
        setBooking(data)
      })
      .catch(() => navigate('/bookings', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  // Live clock — updates every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!booking) return null

  const expiry = getExpiry(booking)
  const msLeft = expiry ? expiry.getTime() - now : 0
  const isExpired = msLeft <= 0
  const countdown = formatCountdown(msLeft)
  const bookingStart = bookingDateTime(booking.date, booking.start_time)
  const hasStarted = now >= bookingStart.getTime()

  return (
    <>
      {/* Print-only global style */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          #receipt { position: fixed; inset: 0; padding: 24px; }
          #no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Back link */}
        <div id="no-print">
          <button
            onClick={() => navigate('/bookings')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            ← Back to My Bookings
          </button>
        </div>

        {/* ── Receipt card ── */}
        <div
          id="receipt"
          className={`bg-white rounded-2xl border-2 shadow-lg overflow-hidden ${
            isExpired ? 'border-gray-200' : 'border-green-400'
          }`}
        >
          {/* Header strip */}
          <div className={`px-6 py-5 ${isExpired ? 'bg-gray-100' : 'bg-green-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className={`w-5 h-5 ${isExpired ? 'text-gray-500' : 'text-white'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-bold text-sm leading-none ${isExpired ? 'text-gray-700' : 'text-white'}`}>
                    VenueBook
                  </p>
                  <p className={`text-[10px] uppercase tracking-widest mt-0.5 ${isExpired ? 'text-gray-500' : 'text-green-100'}`}>
                    University System
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[10px] uppercase tracking-wider font-semibold ${isExpired ? 'text-gray-400' : 'text-green-100'}`}>
                  Booking Receipt
                </p>
                <p className={`text-xs font-mono font-bold mt-0.5 ${isExpired ? 'text-gray-600' : 'text-white'}`}>
                  #{shortRef(booking.id)}
                </p>
              </div>
            </div>
          </div>

          {/* Status banner */}
          <div className={`flex items-center justify-between px-6 py-3 border-b ${
            isExpired
              ? 'bg-gray-50 border-gray-100'
              : 'bg-green-50 border-green-100'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                isExpired ? 'text-gray-400' : 'text-green-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isExpired ? 'bg-gray-400' : 'bg-green-500 animate-pulse'
                }`} />
                {isExpired ? 'EXPIRED' : hasStarted ? 'ACTIVE' : 'VALID'}
              </span>
            </div>
            <span className={`text-xs font-medium ${
              isExpired ? 'text-gray-400' : 'text-green-600'
            }`}>
              {isExpired ? 'This receipt has expired' : countdown}
            </span>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">

            {/* Student */}
            <section>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Booking Holder
              </p>
              <p className="text-base font-bold text-gray-900">{booking.user_full_name}</p>
              <p className="text-sm text-gray-500">{booking.user_email}</p>
              {user?.matric_number && (
                <p className="text-xs text-gray-400 mt-0.5">Matric · {user.matric_number}</p>
              )}
            </section>

            <div className="border-t border-dashed border-gray-200" />

            {/* Venue */}
            <section>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Venue
              </p>
              <p className="text-base font-bold text-gray-900">{booking.venue_name}</p>
              <p className="text-sm text-gray-500">{booking.venue_location}</p>
            </section>

            <div className="border-t border-dashed border-gray-200" />

            {/* Date & time */}
            <section>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Date & Time
              </p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(booking.date)}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
                {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
              </p>
            </section>

            <div className="border-t border-dashed border-gray-200" />

            {/* Details row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Purpose
                </p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {booking.purpose_display ?? booking.purpose}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Attendees
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {booking.expected_attendees} people
                </p>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200" />

            {/* Admin stamp */}
            <div className="flex items-center justify-center py-2">
              <div className={`relative flex flex-col items-center justify-center w-44 h-44 rounded-full border-4 border-dashed ${
                isExpired
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-green-500 bg-green-50'
              }`}>
                {/* Inner circle */}
                <div className={`absolute inset-3 rounded-full border-2 ${
                  isExpired ? 'border-gray-200' : 'border-green-400'
                }`} />

                <div className="relative flex flex-col items-center">
                  {isExpired ? (
                    <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-green-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <p className={`text-sm font-black tracking-widest uppercase ${
                    isExpired ? 'text-gray-400' : 'text-green-700'
                  }`}>
                    {isExpired ? 'EXPIRED' : 'APPROVED'}
                  </p>
                  <p className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${
                    isExpired ? 'text-gray-400' : 'text-green-600'
                  }`}>
                    VenueBook Admin
                  </p>
                  <p className={`text-[9px] font-mono mt-1 text-center leading-tight ${
                    isExpired ? 'text-gray-400' : 'text-green-600'
                  }`}>
                    {formatStamp(booking.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Valid until */}
            <div className={`rounded-xl px-4 py-3 text-center ${
              isExpired ? 'bg-gray-50' : 'bg-green-50'
            }`}>
              <p className={`text-xs font-medium ${isExpired ? 'text-gray-400' : 'text-green-700'}`}>
                {isExpired
                  ? 'This receipt expired after the booking ended'
                  : `Valid until ${formatValidUntil(expiry)}`
                }
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">
              This is an official VenueBook receipt. Receipt ID #{shortRef(booking.id)} · Auto-expires 3 minutes after booking ends.
            </p>
          </div>
        </div>

        {/* Print button */}
        <div id="no-print" className="flex justify-center pb-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
        </div>
      </div>
    </>
  )
}
