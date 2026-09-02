export type SlotMinutes = 30 | 60

export interface YueResponse {
  name: string
  slots: string[]
  updatedAt: string
}

export interface YueEvent {
  id: string
  title: string
  dates: string[]
  startHour: number
  endHour: number
  slotMinutes: SlotMinutes
  timezone: 'Asia/Shanghai'
  createdAt: string
  responses: YueResponse[]
}

export interface CreateEventInput {
  title: string
  dates: string[]
  startHour: number
  endHour: number
  slotMinutes: SlotMinutes
}

export interface SaveResponseInput {
  name: string
  slots: string[]
}
