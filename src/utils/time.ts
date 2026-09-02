export const TZ = 'Asia/Shanghai'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

/** YYYY-MM-DD in Asia/Shanghai */
export function shanghaiDateISO(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function shanghaiNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00+08:00`)
}

export function upcomingDates(count = 14): string[] {
  const today = shanghaiDateISO()
  const start = shanghaiNoon(today).getTime()
  const dates: string[] = []
  for (let i = 0; i < count; i++)
    dates.push(shanghaiDateISO(new Date(start + i * 86400000)))
  return dates
}

export function slotTimes(startHour: number, endHour: number, slotMinutes: 30 | 60): string[] {
  const out: string[] = []
  for (let m = startHour * 60; m < endHour * 60; m += slotMinutes) {
    const h = Math.floor(m / 60)
    const min = m % 60
    out.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return out
}

export function slotKey(date: string, time: string): string {
  return `${date}T${time}`
}

export function weekdayIndex(isoDate: string): number {
  return shanghaiNoon(isoDate).getUTCDay()
}

export function dayChipLabel(isoDate: string): string {
  const [, m, d] = isoDate.split('-')
  return `${Number(m)}/${Number(d)} 周${WEEKDAYS[weekdayIndex(isoDate)]}`
}

export function dayHeaderLabel(isoDate: string): { week: string, md: string } {
  const [, m, d] = isoDate.split('-')
  return {
    week: `周${WEEKDAYS[weekdayIndex(isoDate)]}`,
    md: `${Number(m)}/${Number(d)}`,
  }
}

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)
