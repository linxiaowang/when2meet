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
  return eventPath(id)
}

function getWxCloud() {
  const g = globalThis as typeof globalThis & { wx?: { cloud?: { callFunction: (o: object) => Promise<{ result: unknown }> } } }
  if (!g.wx?.cloud)
    throw new Error('cloud unavailable')
  return g.wx.cloud
}

interface YueCloudResult {
  ok?: boolean
  event?: YueEvent
  openid?: string
  error?: string
}

async function callYue(data: Record<string, unknown>): Promise<{ event: YueEvent, openid?: string }> {
  const cloud = getWxCloud()
  const res = await cloud.callFunction({ name: 'yue', data })
  const result = res.result as YueCloudResult
  if (!result?.ok || !result.event)
    throw new Error(result?.error || 'cloud fail')
  return { event: result.event, openid: result.openid }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const raw = uni.getStorageSync(key)
      if (raw === '' || raw == null)
        return fallback
      return raw as T
    }
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) as T : fallback
    }
  }
  catch {}
  return fallback
}

function writeStorage(key: string, value: unknown) {
  try {
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(key, value)
      return
    }
    if (typeof localStorage !== 'undefined')
      localStorage.setItem(key, JSON.stringify(value))
  }
  catch {}
}

function persistRef<T>(key: string, fallback: T) {
  const state = ref(readStorage(key, fallback))
  watch(state, value => writeStorage(key, value), { deep: true })
  return state
}

export const useEventStore = defineStore('yue', () => {
  const events = persistRef<Record<string, YueEvent>>('yue-events', {})
  const selfId = persistRef('yue-self-id', '')

  function cache(event: YueEvent) {
    events.value = { ...events.value, [event.id]: event }
  }

  function adoptOpenid(openid?: string) {
    if (!openid)
      return
    selfId.value = openid
    try {
      if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function')
        uni.setStorageSync('yue-self-id', openid)
    }
    catch {}
  }

  async function runYue(data: Record<string, unknown>) {
    const { event, openid } = await callYue(data)
    adoptOpenid(openid)
    return event
  }

  async function createEvent(draft: Omit<YueEvent, 'id' | 'participants'>) {
    const created = await runYue({ action: 'create', ...draft })
    if (!created?.id)
      throw new Error('create failed')
    cache(created)
    return created
  }

  async function loadEvent(id: string) {
    try {
      const remote = await runYue({ action: 'get', id })
      const merged: YueEvent = {
        ...remote,
        id,
        participants: remote.participants || [],
      }
      cache(merged)
      return merged
    }
    catch {
      return null
    }
  }

  async function saveMine(id: string, name: string, slots: string[]) {
    const saved = await runYue({
      action: 'put',
      id,
      name,
      slots,
    })
    cache(saved)
    return saved
  }

  return {
    events,
    selfId,
    createEvent,
    loadEvent,
    saveMine,
  }
})
