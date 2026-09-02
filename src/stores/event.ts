import { defineStore } from 'pinia'

export interface Participant {
  id: string
  name: string
  slots: string[]
}

export interface YueEvent {
  id: string
  title: string
  startDate: string
  dayCount: number
  startHour: number
  endHour: number
  slotMinutes: number
  participants: Participant[]
}

const REMOTE = 'https://jsonblob.iiif.arthistoricum.net/api/jsonBlob'

export function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  const pad = (m: number) => String(m).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function eventDays(event: YueEvent) {
  return Array.from({ length: event.dayCount }, (_, i) => addDays(event.startDate, i))
}

export function eventTimes(event: YueEvent) {
  const times: string[] = []
  const step = event.slotMinutes || 30
  for (let h = event.startHour; h < event.endHour; h++) {
    for (let m = 0; m < 60; m += step)
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return times
}

export function slotKey(day: string, time: string) {
  return `${day}T${time}`
}

export function slotCounts(event: YueEvent) {
  const counts: Record<string, number> = {}
  for (const person of event.participants) {
    for (const slot of person.slots)
      counts[slot] = (counts[slot] || 0) + 1
  }
  return counts
}

export function eventPath(id: string) {
  return `/pages/event?id=${id}`
}

export function h5ShareUrl(id: string) {
  if (typeof window !== 'undefined' && window.location) {
    const { origin, pathname, search } = window.location
    return `${origin}${pathname}${search}#${eventPath(id)}`
  }
  return eventPath(id)
}

function headerOf(header: Record<string, string> | undefined, name: string) {
  if (!header)
    return ''
  const key = Object.keys(header).find(k => k.toLowerCase() === name.toLowerCase())
  return key ? header[key] : ''
}

function request(options: UniApp.RequestOptions) {
  return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      ...options,
      success: resolve,
      fail: reject,
    })
  })
}

async function createRemote(event: YueEvent) {
  const res = await request({
    url: REMOTE,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    data: event,
  })
  if (res.statusCode !== 201 && res.statusCode !== 200)
    throw new Error(`create ${res.statusCode}`)
  const blobId = headerOf(res.header as Record<string, string>, 'x-jsonblob')
    || headerOf(res.header as Record<string, string>, 'location').split('/').filter(Boolean).pop()
  if (!blobId)
    throw new Error('missing blob id')
  return blobId
}

async function fetchRemote(id: string) {
  const res = await request({
    url: `${REMOTE}/${id}`,
    method: 'GET',
    header: { Accept: 'application/json' },
  })
  if (res.statusCode === 404)
    return null
  if (res.statusCode !== 200)
    throw new Error(`fetch ${res.statusCode}`)
  return res.data as YueEvent
}

async function putRemote(event: YueEvent) {
  const res = await request({
    url: `${REMOTE}/${event.id}`,
    method: 'PUT',
    header: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    data: event,
  })
  if (res.statusCode !== 200)
    throw new Error(`put ${res.statusCode}`)
}

export const useEventStore = defineStore('yue', () => {
  const events = useStorage<Record<string, YueEvent>>('yue-events', {})
  const selfId = useStorage('yue-self-id', createId())

  function cache(event: YueEvent) {
    events.value = { ...events.value, [event.id]: event }
  }

  async function createEvent(draft: Omit<YueEvent, 'id' | 'participants'>) {
    const localId = createId()
    const seed: YueEvent = { ...draft, id: localId, participants: [] }
    cache(seed)
    try {
      const id = await createRemote({ ...seed, id: localId })
      const created = { ...seed, id }
      cache(created)
      if (id !== localId) {
        const next = { ...events.value }
        delete next[localId]
        events.value = next
        cache(created)
      }
      return created
    }
    catch {
      return seed
    }
  }

  async function loadEvent(id: string) {
    const local = events.value[id]
    try {
      const remote = await fetchRemote(id)
      if (remote) {
        const merged: YueEvent = {
          ...remote,
          id,
          participants: mergeParticipants(local?.participants || [], remote.participants || []),
        }
        cache(merged)
        return merged
      }
    }
    catch {
      // 远程失败时用本地缓存，保证同一设备仍能打开约
    }
    return local || null
  }

  async function saveMine(id: string, name: string, slots: string[]) {
    const current = await loadEvent(id) || events.value[id]
    if (!current)
      throw new Error('event missing')
    const mine: Participant = {
      id: selfId.value,
      name: name.trim() || '匿名',
      slots,
    }
    const next: YueEvent = {
      ...current,
      participants: [
        ...current.participants.filter(p => p.id !== mine.id),
        mine,
      ],
    }
    cache(next)
    try {
      await putRemote(next)
    }
    catch {
      // 本地已保存，跨设备同步失败时仍可在本机看重叠
    }
    return next
  }

  return {
    events,
    selfId,
    createEvent,
    loadEvent,
    saveMine,
  }
})

function mergeParticipants(a: Participant[], b: Participant[]) {
  const map = new Map<string, Participant>()
  for (const p of [...a, ...b])
    map.set(p.id, p)
  return [...map.values()]
}
