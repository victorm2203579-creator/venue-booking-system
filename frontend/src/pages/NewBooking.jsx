import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAllVenues } from '../api/venues'
import { createBooking } from '../api/bookings'
import toast from 'react-hot-toast'

const PURPOSES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'event', label: 'Event' },
  { value: 'exam', label: 'Exam' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'departmental', label: 'Departmental' },
  { value: 'other', label: 'Other' },
]

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function FieldError({ errors, field }) {
  const msg = errors?.[field]
  if (!msg) return null
  const text = Array.isArray(msg) ? msg[0] : msg
  return <p className="mt-1 text-xs text-red-600">{text}</p>
}

export default function NewBooking() {
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedVenueId = location.state?.venueId ?? ''

  const [venues, setVenues] = useState([])
  const [form, setForm] = useState({
    venue: preselectedVenueId,
    date: tomorrow(),
    start_time: '09:00',
    end_time: '11:00',
    purpose: 'lecture',
    expected_attendees: '',
    additional_notes: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getAllVenues({ is_active: true })
      .then(({ data }) => setVenues(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {})
  }, [])

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      await createBooking({
        ...form,
        expected_attendees: Number(form.expected_attendees),
      })
      toast.success('Booking submitted! Awaiting admin approval.')
      navigate('/bookings')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
        const top = data.non_field_errors ?? data.detail
        if (top) toast.error(Array.isArray(top) ? top[0] : top)
      } else {
        toast.error('Submission failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Booking</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <select
              value={form.venue}
              onChange={set('venue')}
              required
              className="block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">— Select a venue —</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (capacity: {v.capacity})
                </option>
              ))}
            </select>
            <FieldError errors={errors} field="venue" />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              min={tomorrow()}
              onChange={set('date')}
              required
              className="block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <FieldError errors={errors} field="date" />
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={set('start_time')}
                required
                className="block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <FieldError errors={errors} field="start_time" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={set('end_time')}
                required
                className="block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <FieldError errors={errors} field="end_time" />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <select
              value={form.purpose}
              onChange={set('purpose')}
              required
              className="block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <FieldError errors={errors} field="purpose" />
          </div>

          {/* Expected Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Attendees
            </label>
            <input
              type="number"
              value={form.expected_attendees}
              onChange={set('expected_attendees')}
              min={1}
              required
              placeholder="e.g. 50"
              className="block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <FieldError errors={errors} field="expected_attendees" />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
              <span className="ml-1 text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.additional_notes}
              onChange={set('additional_notes')}
              rows={3}
              placeholder="Any special requirements or notes for the admin…"
              className="block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <FieldError errors={errors} field="additional_notes" />
          </div>

          {/* Non-field error */}
          {errors.non_field_errors && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {Array.isArray(errors.non_field_errors)
                ? errors.non_field_errors[0]
                : errors.non_field_errors}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Booking'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
