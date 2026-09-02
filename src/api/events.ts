import type { CreateEventInput, SaveResponseInput, YueEvent } from '~/shared/types'
import { request } from './http'

export function createEvent(input: CreateEventInput) {
  return request<YueEvent>('/api/events', {
    method: 'POST',
    data: input,
  })
}

export function getEvent(id: string) {
  return request<YueEvent>(`/api/events/${encodeURIComponent(id)}`)
}

export function saveResponse(id: string, input: SaveResponseInput) {
  return request<YueEvent>(`/api/events/${encodeURIComponent(id)}/response`, {
    method: 'PUT',
    data: input,
  })
}
