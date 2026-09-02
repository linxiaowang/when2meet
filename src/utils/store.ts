export interface Participant {
  name: string
  slots: string[]
}

export interface YueEvent {
  id: string
  title: string
  dates: string[]
  startHour: number
  endHour: number
  slotMinutes: 30 | 60
  timezone: 'Asia/Shanghai'
  participants: Participant[]
  createdAt: string
}

export type YueEventDraft = Omit<YueEvent, 'id'>

interface RestfulObject {
  id: string
  name: string
  data?: YueEventDraft & { id?: string }
}

const STORE_BASE = import.meta.env.VITE_EVENT_STORE_BASE || 'https://api.restful-api.dev/objects'

function request<T>(opts: {
  url: string
  method: 'GET' | 'POST' | 'PUT'
  data?: unknown
}): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: opts.url,
      method: opts.method,
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      data: opts.data as AnyObject | undefined,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300)
          resolve(res.data as T)
        else
          reject(new Error(`存储请求失败 (${res.statusCode})`))
      },
      fail: err => reject(new Error(err.errMsg || '网络错误')),
    })
  })
}

function unwrap(obj: RestfulObject): YueEvent {
  const data = obj.data
  if (!data)
    throw new Error('活动数据损坏')
  return {
    id: obj.id,
    title: data.title || obj.name || '未命名',
    dates: data.dates || [],
    startHour: data.startHour,
    endHour: data.endHour,
    slotMinutes: data.slotMinutes,
    timezone: 'Asia/Shanghai',
    participants: Array.isArray(data.participants) ? data.participants : [],
    createdAt: data.createdAt || '',
  }
}

function wrap(event: YueEventDraft) {
  return {
    name: event.title || '未命名',
    data: {
      ...event,
      timezone: 'Asia/Shanghai' as const,
    },
  }
}

export async function createEvent(draft: YueEventDraft): Promise<YueEvent> {
  const created = await request<RestfulObject>({
    url: STORE_BASE,
    method: 'POST',
    data: wrap(draft),
  })
  return unwrap(created)
}

export async function getEvent(id: string): Promise<YueEvent> {
  const obj = await request<RestfulObject>({
    url: `${STORE_BASE}/${encodeURIComponent(id)}`,
    method: 'GET',
  })
  return unwrap(obj)
}

export async function saveParticipant(
  id: string,
  name: string,
  slots: string[],
): Promise<YueEvent> {
  const event = await getEvent(id)
  const trimmed = name.trim()
  const next = event.participants.filter(p => p.name !== trimmed)
  next.push({ name: trimmed, slots: [...slots] })
  event.participants = next
  const updated = await request<RestfulObject>({
    url: `${STORE_BASE}/${encodeURIComponent(id)}`,
    method: 'PUT',
    data: wrap(event),
  })
  return unwrap(updated)
}

export function buildShareUrl(id: string): string {
  if (typeof window !== 'undefined' && window.location) {
    const { origin, pathname } = window.location
    return `${origin}${pathname}#/pages/event?id=${encodeURIComponent(id)}`
  }
  return `/pages/event?id=${id}`
}
