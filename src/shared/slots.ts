import type { SlotMinutes, YueEvent } from './types'

export function buildTimes(startHour: number, endHour: number, slotMinutes: SlotMinutes): string[] {
  const out: string[] = []
  for (let m = startHour * 60; m < endHour * 60; m += slotMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    out.push(`${hh}:${mm}`)
  }
  return out
}

export function slotKey(date: string, time: string): string {
  return `${date}T${time}`
}

export function parseSlotKey(key: string): { date: string, time: string } | null {
  if (typeof key !== 'string')
    return null
  const m = key.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/)
  if (!m)
    return null
  return { date: m[1], time: m[2] }
}

export function eventTimes(event: Pick<YueEvent, 'startHour' | 'endHour' | 'slotMinutes'>): string[] {
  return buildTimes(event.startHour, event.endHour, event.slotMinutes)
}

export function allowedSlotSet(event: Pick<YueEvent, 'dates' | 'startHour' | 'endHour' | 'slotMinutes'>): Set<string> {
  const times = eventTimes(event)
  const set = new Set<string>()
  for (const date of event.dates) {
    for (const time of times)
      set.add(slotKey(date, time))
  }
  return set
}

export function countBySlot(event: Pick<YueEvent, 'responses'>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const response of event.responses) {
    for (const key of response.slots)
      counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

export function namesBySlot(event: Pick<YueEvent, 'responses'>): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const response of event.responses) {
    for (const key of response.slots) {
      if (!map[key])
        map[key] = []
      map[key].push(response.name)
    }
  }
  return map
}

export function heatmapColor(count: number, max: number): string {
  if (count <= 0 || max <= 0)
    return '#f4f4f5'
  const t = Math.min(1, count / max)
  const light = 92 - Math.round(t * 42)
  const sat = 35 + Math.round(t * 40)
  return `hsl(173 ${sat}% ${light}%)`
}
