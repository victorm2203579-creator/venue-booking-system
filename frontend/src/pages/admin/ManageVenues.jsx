import { useEffect, useState } from 'react'
import { getAllVenues, createVenue, updateVenue } from '../../api/venues'
import toast from 'react-hot-toast'

const VENUE_TYPES = [
  { value: 'lecture_hall', label: 'Lecture Hall' },
  { value: 'seminar_room', label: 'Seminar Room' },
  { value: 'lab', label: 'Lab' },
  { value: 'event_center', label: 'Event Center' },
  { value: 'conference_room', label: 'Conference Room' },
  { value: 'sports_hall', label: 'Sports Hall' },
  { value: 'other', label: 'Other' },
]

const TYPE_LABEL = Object.fromEntries(VENUE_TYPES.map(({ value, label }) => [value, label]))

const EMPTY_FORM = {
  name: '', location: '', capacity: '', venue_type: 'lecture_hall',
  description: '', facilities: '',
}

function VenueForm({ initial = EMPTY_FORM, onSave, onCancel, saving, errors }) {
  const [form, setForm] = useState(initial)
  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const inputCls =
    'block w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500'

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
        <input type="text" value={form.name} onChange={set('name')} required className={inputCls} />
        {errors?.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Location *</label>
        <input type="text" value={form.location} onChange={set('location')} required className={inputCls} />
        {errors?.location && <p className="mt-1 text-xs text-red-600">{errors.location[0]}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Capacity *</label>
        <input type="number" min={1} value={form.capacity} onChange={set('capacity')} required className={inputCls} />
        {errors?.capacity && <p className="mt-1 text-xs text-red-600">{errors.capacity[0]}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Venue Type *</label>
        <select value={form.venue_type} onChange={set('venue_type')} className={inputCls}>
          {VENUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Facilities</label>
        <input type="text" value={form.facilities} onChange={set('facilities')} placeholder="e.g. Projector, Whiteboard, AC" className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea rows={2} value={form.description} onChange={set('description')} className={inputCls} />
      </div>
      <div className="sm:col-span-2 flex gap-3">
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ManageVenues() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [toggling, setToggling] = useState(null)

  const load = () => {
    setLoading(true)
    getAllVenues()
      .then(({ data }) => setVenues(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── Add new venue ──────────────────────────────────────────────────────

  const handleAdd = async (form) => {
    setFormErrors({})
    setSaving(true)
    try {
      const payload = { ...form, capacity: Number(form.capacity) }
      const { data } = await createVenue(payload)
      setVenues((prev) => [data, ...prev])
      setAddingNew(false)
      toast.success(`"${data.name}" created.`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setFormErrors(data)
      else toast.error('Could not create venue.')
    } finally {
      setSaving(false)
    }
  }

  // ── Edit venue ────────────────────────────────────────────────────────

  const handleEdit = async (id, form) => {
    setFormErrors({})
    setSaving(true)
    try {
      const payload = { ...form, capacity: Number(form.capacity) }
      const { data } = await updateVenue(id, payload)
      setVenues((prev) => prev.map((v) => (v.id === id ? data : v)))
      setEditingId(null)
      toast.success(`"${data.name}" updated.`)
    } catch (err) {
      const errData = err.response?.data
      if (errData && typeof errData === 'object') setFormErrors(errData)
      else toast.error('Could not update venue.')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active ────────────────────────────────────────────────────

  const handleToggle = async (venue) => {
    setToggling(venue.id)
    const newState = !venue.is_active
    try {
      const { data } = await updateVenue(venue.id, { is_active: newState })
      setVenues((prev) => prev.map((v) => (v.id === venue.id ? data : v)))
      toast.success(`"${venue.name}" ${newState ? 'activated' : 'deactivated'}.`)
    } catch {
      toast.error('Could not update venue status.')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Venues</h1>
        {!addingNew && (
          <button
            onClick={() => { setAddingNew(true); setEditingId(null); setFormErrors({}) }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            + Add New Venue
          </button>
        )}
      </div>

      {/* ── Add form ────────────────────────────────────────────────── */}
      {addingNew && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">New Venue</p>
          <VenueForm
            onSave={handleAdd}
            onCancel={() => { setAddingNew(false); setFormErrors({}) }}
            saving={saving}
            errors={formErrors}
          />
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
        ) : venues.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            No venues yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Location', 'Type', 'Cap.', 'Facilities', 'Status', 'Actions'].map((h) => (
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
                {venues.map((venue) => (
                  editingId === venue.id ? (
                    /* ── Inline edit row ── */
                    <tr key={venue.id} className="bg-indigo-50">
                      <td colSpan={7} className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900 mb-3">
                          Editing: {venue.name}
                        </p>
                        <VenueForm
                          initial={{
                            name: venue.name,
                            location: venue.location,
                            capacity: String(venue.capacity),
                            venue_type: venue.venue_type,
                            description: venue.description ?? '',
                            facilities: venue.facilities ?? '',
                          }}
                          onSave={(form) => handleEdit(venue.id, form)}
                          onCancel={() => { setEditingId(null); setFormErrors({}) }}
                          saving={saving}
                          errors={formErrors}
                        />
                      </td>
                    </tr>
                  ) : (
                    /* ── Normal row ── */
                    <tr key={venue.id} className={`hover:bg-gray-50 transition-colors ${!venue.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {venue.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {venue.location}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {TYPE_LABEL[venue.venue_type] ?? venue.venue_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {venue.capacity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {venue.facilities || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            venue.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {venue.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(venue.id)
                              setAddingNew(false)
                              setFormErrors({})
                            }}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggle(venue)}
                            disabled={toggling === venue.id}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors ${
                              venue.is_active
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {toggling === venue.id
                              ? '…'
                              : venue.is_active
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
