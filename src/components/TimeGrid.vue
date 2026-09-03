<script setup lang="ts">
const props = defineProps<{
  days: string[]
  times: string[]
  counts: Record<string, number>
  mine: string[]
  maxCount: number
}>()

const emit = defineEmits<{
  paint: [slots: string[]]
}>()

const gridRef = ref<HTMLElement | null>(null)
const draft = ref(new Set(props.mine))
const painting = ref(false)
const paintOn = ref(true)
const lastKey = ref('')

watch(() => props.mine, (mine) => {
  if (!painting.value)
    draft.value = new Set(mine)
})

const mineSet = computed(() => draft.value)

function weekday(iso: string) {
  return '日一二三四五六'[new Date(`${iso}T00:00:00`).getDay()]
}

function shortDay(iso: string) {
  return `${iso.slice(5).replace('-', '/')}周${weekday(iso)}`
}

function heat(count: number) {
  if (!count)
    return ''
  const t = count / Math.max(props.maxCount, 1)
  return `rgba(13, 148, 136, ${0.22 + t * 0.72})`
}

function applyKeys(keys: string[]) {
  if (!keys.length)
    return
  const next = new Set(draft.value)
  for (const key of keys) {
    if (!key)
      continue
    if (paintOn.value)
      next.add(key)
    else
      next.delete(key)
  }
  draft.value = next
}

function indexOfKey(key: string) {
  if (!key)
    return { col: -1, row: -1 }
  return {
    col: props.days.indexOf(key.slice(0, 10)),
    row: props.times.indexOf(key.slice(11)),
  }
}

function keyAt(col: number, row: number) {
  if (col < 0 || row < 0 || col >= props.days.length || row >= props.times.length)
    return ''
  return `${props.days[col]}T${props.times[row]}`
}

function slotFromPoint(x: number, y: number) {
  const root = gridRef.value
  if (!root || typeof document === 'undefined')
    return ''
  const origin = root.querySelector('[data-slot]') as HTMLElement | null
  if (!origin)
    return ''
  const r = origin.getBoundingClientRect()
  const w = r.width
  const h = r.height
  if (w < 8 || h < 8)
    return ''
  const col = Math.floor((x - r.left) / w)
  const row = Math.floor((y - r.top) / h)
  return keyAt(col, row)
}

function lineKeys(from: string, to: string) {
  if (!to)
    return []
  if (!from || from === to)
    return [to]
  const a = indexOfKey(from)
  const b = indexOfKey(to)
  if (a.col < 0 || a.row < 0 || b.col < 0 || b.row < 0)
    return [to]
  const dc = b.col - a.col
  const dr = b.row - a.row
  const steps = Math.max(Math.abs(dc), Math.abs(dr))
  const keys: string[] = []
  for (let i = 0; i <= steps; i++) {
    const col = a.col + Math.round((i * dc) / steps)
    const row = a.row + Math.round((i * dr) / steps)
    const key = keyAt(col, row)
    if (key)
      keys.push(key)
  }
  return keys
}

function pointOf(e: TouchEvent | MouseEvent) {
  const t = 'touches' in e ? e.touches[0] || e.changedTouches?.[0] : e
  return t ? { x: t.clientX, y: t.clientY } : null
}

function hitLabel(x: number, y: number) {
  if (typeof document === 'undefined')
    return false
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  return Boolean(el?.closest?.('[data-lab]'))
}

function onGridStart(e: Event) {
  const pt = pointOf(e as TouchEvent | MouseEvent)
  if (!pt)
    return
  if (hitLabel(pt.x, pt.y))
    return
  const key = slotFromPoint(pt.x, pt.y)
  if (!key || painting.value)
    return
  e.preventDefault()
  painting.value = true
  paintOn.value = !draft.value.has(key)
  lastKey.value = key
  applyKeys([key])
}

function onGridMove(e: Event) {
  if (!painting.value)
    return
  e.preventDefault()
  const pt = pointOf(e as TouchEvent | MouseEvent)
  if (!pt)
    return
  const key = slotFromPoint(pt.x, pt.y)
  if (!key || key === lastKey.value)
    return
  applyKeys(lineKeys(lastKey.value, key))
  lastKey.value = key
}

function endPaint() {
  if (!painting.value)
    return
  painting.value = false
  lastKey.value = ''
  emit('paint', [...draft.value])
}

function lockScroll(e: Event) {
  if (painting.value)
    e.preventDefault()
}

onMounted(() => {
  if (typeof window === 'undefined')
    return
  const el = gridRef.value
  el?.addEventListener('touchstart', onGridStart, { passive: false })
  el?.addEventListener('touchmove', onGridMove, { passive: false })
  window.addEventListener('mousemove', onGridMove)
  window.addEventListener('mouseup', endPaint)
  window.addEventListener('touchend', endPaint)
  window.addEventListener('touchcancel', endPaint)
  window.addEventListener('touchmove', lockScroll, { passive: false })
})

onUnmounted(() => {
  if (typeof window === 'undefined')
    return
  const el = gridRef.value
  el?.removeEventListener('touchstart', onGridStart)
  el?.removeEventListener('touchmove', onGridMove)
  window.removeEventListener('mousemove', onGridMove)
  window.removeEventListener('mouseup', endPaint)
  window.removeEventListener('touchend', endPaint)
  window.removeEventListener('touchcancel', endPaint)
  window.removeEventListener('touchmove', lockScroll)
})
</script>

<template>
  <div
    ref="gridRef"
    class="time-grid"
    :class="{ 'is-painting': painting }"
    @mousedown="onGridStart"
    @mousemove="onGridMove"
  >
    <div class="sheet">
      <div class="head">
        <div class="time-lab corner" data-lab="1" />
        <div
          v-for="day in days"
          :key="day"
          class="day-lab"
          data-lab="1"
        >
          {{ shortDay(day) }}
        </div>
      </div>
      <div v-for="time in times" :key="time" class="row">
        <div class="time-lab" data-lab="1" op70>
          {{ time }}
        </div>
        <div
          v-for="day in days"
          :key="`${day}T${time}`"
          class="slot"
          :data-slot="`${day}T${time}`"
          :class="mineSet.has(`${day}T${time}`) ? 'is-mine' : ''"
          :style="{ background: heat(counts[`${day}T${time}`] || 0) }"
        >
          <span v-if="counts[`${day}T${time}`]">
            {{ counts[`${day}T${time}`] }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-grid {
  flex: 1 1 auto;
  min-height: 220px;
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.time-grid.is-painting {
  touch-action: none;
}
.sheet {
  min-width: max-content;
  padding: 0 28px 72px 0;
}
.head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  background: #fff;
}
.row {
  display: flex;
  align-items: stretch;
}
.time-lab,
.day-lab {
  box-sizing: border-box;
  flex-shrink: 0;
}
.time-lab {
  position: sticky;
  left: 0;
  z-index: 2;
  width: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  font-size: 12px;
  background: #fff;
}
.corner {
  z-index: 4;
}
.day-lab {
  width: 72px;
  min-width: 72px;
  padding: 8px 2px;
  text-align: center;
  font-size: 12px;
  line-height: 1.2;
  opacity: 0.8;
}
.slot {
  width: 72px;
  min-width: 72px;
  height: 64px;
  min-height: 64px;
  margin: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  touch-action: none;
}
.dark .head,
.dark .time-lab {
  background: #121212;
}
.dark .slot {
  border-color: #374151;
}
.slot.is-mine {
  box-shadow: inset 0 0 0 3px #0f766e;
}
</style>
