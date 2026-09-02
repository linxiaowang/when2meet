export const TZ = 'Asia/Shanghai'

export function todayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  const yyyy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function weekdayZh(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return '日一二三四五六'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

export function dateShort(ymd: string): string {
  const [, m, d] = ymd.split('-')
  return `${Number(m)}/${Number(d)}`
}

export function dateChip(ymd: string): string {
  return `${dateShort(ymd)} 周${weekdayZh(ymd)}`
}

export function upcomingDays(count: number, now = new Date()): string[] {
  const start = todayYmd(now)
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

export function isoNow(now = new Date()): string {
  return now.toISOString()
}
