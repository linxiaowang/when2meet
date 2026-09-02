import type { YueEvent } from '~/shared/types'

export const SHARE_IMAGE = '/static/share.png'

export function eventPagePath(id: string): string {
  return `/pages/event?id=${encodeURIComponent(id)}`
}

export function eventShareUrl(id: string): string {
  if (typeof window !== 'undefined' && window.location)
    return `${window.location.origin}${window.location.pathname}${window.location.search}#${eventPagePath(id)}`
  return eventPagePath(id)
}

export function currentHref(): string {
  if (typeof window !== 'undefined' && window.location)
    return window.location.href
  return ''
}

export function shareAppMessage(event?: Pick<YueEvent, 'id' | 'title'> | null) {
  return {
    title: event?.title || '约',
    path: event?.id ? eventPagePath(event.id) : '/pages/index',
    imageUrl: SHARE_IMAGE,
  }
}

export function shareTimeline(event?: Pick<YueEvent, 'id' | 'title'> | null) {
  return {
    title: event?.title || '约',
    query: event?.id ? `id=${encodeURIComponent(event.id)}` : '',
    imageUrl: SHARE_IMAGE,
  }
}
