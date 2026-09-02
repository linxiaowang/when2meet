import type { CreateEventInput, SaveResponseInput, YueEvent } from '../src/shared/types'
import { allowedSlotSet } from '../src/shared/slots'
import { isoNow } from '../src/shared/time'

export interface EventStore {
  get: (id: string) => Promise<YueEvent | null>
  set: (id: string, event: YueEvent) => Promise<void>
}

export interface ApiRequest {
  method: string
  path: string
  body?: string
}

export interface ApiResponse {
  status: number
  headers: Record<string, string>
  body: string
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
}

const JSON_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json; charset=utf-8',
}

function json(status: number, data: unknown): ApiResponse {
  return { status, headers: JSON_HEADERS, body: JSON.stringify(data) }
}

function ymdOk(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function normalizePath(path: string): string {
  const raw = path.split('?')[0]
  const idx = raw.indexOf('/api/')
  if (idx >= 0)
    return raw.slice(idx).replace(/\/+$/, '') || '/api'
  const stripped = raw.replace(/^\/\.netlify\/functions\/api/, '')
  if (!stripped || stripped === '/')
    return '/api'
  return `/api${stripped.startsWith('/') ? stripped : `/${stripped}`}`.replace(/\/+$/, '')
}

function parseCreate(body: string | undefined): CreateEventInput {
  let data: Partial<CreateEventInput> = {}
  try {
    data = body ? JSON.parse(body) : {}
  }
  catch {
    throw new Error('JSON 无效')
  }
  const title = String(data.title || '').trim()
  if (!title)
    throw new Error('请填写标题')
  if (title.length > 80)
    throw new Error('标题太长')
  const dates = Array.isArray(data.dates) ? [...new Set(data.dates.map(String))].filter(ymdOk) : []
  if (!dates.length)
    throw new Error('请选择至少一天')
  if (dates.length > 14)
    throw new Error('一次最多 14 天')
  dates.sort()
  const startHour = Number(data.startHour)
  const endHour = Number(data.endHour)
  if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23)
    throw new Error('开始时间无效')
  if (!Number.isInteger(endHour) || endHour < 1 || endHour > 24)
    throw new Error('结束时间无效')
  if (endHour <= startHour)
    throw new Error('结束时间需晚于开始时间')
  const slotMinutes = Number(data.slotMinutes)
  if (slotMinutes !== 30 && slotMinutes !== 60)
    throw new Error('时间颗粒只能是 30 或 60 分钟')
  return { title, dates, startHour, endHour, slotMinutes }
}

function parseResponse(body: string | undefined, event: YueEvent): SaveResponseInput {
  let data: Partial<SaveResponseInput> = {}
  try {
    data = body ? JSON.parse(body) : {}
  }
  catch {
    throw new Error('JSON 无效')
  }
  const name = String(data.name || '').trim()
  if (!name)
    throw new Error('请填写名字')
  if (name.length > 20)
    throw new Error('名字太长')
  const allowed = allowedSlotSet(event)
  const slots = Array.isArray(data.slots)
    ? [...new Set(data.slots.map(String))].filter(key => allowed.has(key))
    : []
  return { name, slots }
}

export function createHandler(store: EventStore) {
  return async (req: ApiRequest): Promise<ApiResponse> => {
    const method = (req.method || 'GET').toUpperCase()
    const path = normalizePath(req.path)

    if (method === 'OPTIONS')
      return { status: 204, headers: CORS_HEADERS, body: '' }

    if (method === 'GET' && (path === '/api/health' || path === '/api'))
      return json(200, { ok: true, name: '约' })

    if (method === 'POST' && path === '/api/events') {
      try {
        const input = parseCreate(req.body)
        let id = makeId()
        for (let i = 0; i < 5; i++) {
          if (!await store.get(id))
            break
          id = makeId()
        }
        const event: YueEvent = {
          id,
          title: input.title,
          dates: input.dates,
          startHour: input.startHour,
          endHour: input.endHour,
          slotMinutes: input.slotMinutes,
          timezone: 'Asia/Shanghai',
          createdAt: isoNow(),
          responses: [],
        }
        await store.set(id, event)
        return json(201, event)
      }
      catch (error) {
        return json(400, { error: error instanceof Error ? error.message : '创建失败' })
      }
    }

    const eventMatch = path.match(/^\/api\/events\/([^/]+)$/)
    if (method === 'GET' && eventMatch) {
      const event = await store.get(decodeURIComponent(eventMatch[1]))
      if (!event)
        return json(404, { error: '找不到这个约' })
      return json(200, event)
    }

    const saveMatch = path.match(/^\/api\/events\/([^/]+)\/response$/)
    if (method === 'PUT' && saveMatch) {
      const id = decodeURIComponent(saveMatch[1])
      const event = await store.get(id)
      if (!event)
        return json(404, { error: '找不到这个约' })
      try {
        const input = parseResponse(req.body, event)
        const next: YueEvent = {
          ...event,
          responses: event.responses.filter(item => item.name !== input.name),
        }
        next.responses.push({
          name: input.name,
          slots: input.slots,
          updatedAt: isoNow(),
        })
        await store.set(id, next)
        return json(200, next)
      }
      catch (error) {
        return json(400, { error: error instanceof Error ? error.message : '保存失败' })
      }
    }

    return json(404, { error: '接口不存在' })
  }
}
