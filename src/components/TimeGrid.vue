<script setup lang="ts">
const props = defineProps<{
  days: string[]
  times: string[]
  counts: Record<string, number>
  mine: string[]
  maxCount: number
  height?: number
}>()
const emit = defineEmits<{
  paint: [slots: string[]]
}>()
const CELL_W = 44
const CELL_H = 24
const LABEL_W = 36
const HEAD_H = 20

const draft = ref(new Set(props.mine))
const painting = ref(false)
const paintOn = ref(true)
const lastKey = ref('')
const startPt = ref<{ x: number, y: number } | null>(null)
const startIndex = ref({ col: 0, row: 0 })

watch(() => props.mine, (mine) => {
  if (!painting.value)
    draft.value = new Set(mine)
})

const mineSet = computed(() => draft.value)
const sheetWidth = computed(() => LABEL_W + props.days.length * CELL_W)
const sheetHeight = computed(() => HEAD_H + props.times.length * CELL_H)
const gridHeight = computed(() => Math.max(280, props.height || 360))

function shortDay(iso: string) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`
}

function heat(count: number) {
  if (!count)
    return '#f9fafb'
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

function pointOf(e: Event): { x: number, y: number } | null {
  const ev = e as Event & { touches?: { clientX: number, clientY: number }[], changedTouches?: { clientX: number, clientY: number }[], clientX?: number, clientY?: number }
  const t = ev.touches?.[0] || ev.changedTouches?.[0]
  if (t && typeof t.clientX === 'number')
    return { x: t.clientX, y: t.clientY }
  if (typeof ev.clientX === 'number' && typeof ev.clientY === 'number')
    return { x: ev.clientX, y: ev.clientY }
  return null
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

function startPaint(key: string, e: Event) {
  if (!key || painting.value)
    return
  painting.value = true
  paintOn.value = !draft.value.has(key)
  lastKey.value = key
  startPt.value = pointOf(e)
  startIndex.value = indexOfKey(key)
  applyKeys([key])
}

function movePaint(e: Event) {
  if (!painting.value)
    return
  const pt = pointOf(e)
  if (!pt)
    return
  let key = ''
  if (startPt.value) {
    const col = startIndex.value.col + Math.round((pt.x - startPt.value.x) / CELL_W)
    const row = startIndex.value.row + Math.round((pt.y - startPt.value.y) / CELL_H)
    key = keyAt(col, row)
  }
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
  startPt.value = null
  emit('paint', [...draft.value])
}

onMounted(() => {
  if (typeof window === 'undefined')
    return
  window.addEventListener('mousemove', movePaint as EventListener)
  window.addEventListener('mouseup', endPaint)
})

onUnmounted(() => {
  if (typeof window === 'undefined')
    return
  window.removeEventListener('mousemove', movePaint as EventListener)
  window.removeEventListener('mouseup', endPaint)
})
</script>

<template>
  <view class="grid-box" :style="{ height: `${gridHeight}px` }">
    <scroll-view
      class="time-grid"
      :class="{ 'is-painting': painting }"
      :scroll-x="true"
      :scroll-y="true"
      :style="{ height: `${gridHeight}px`, width: '100%' }"
      @touchend="endPaint"
      @touchcancel="endPaint"
    >
      <view
        class="sheet"
        :style="{ width: `${sheetWidth}px`, height: `${sheetHeight}px` }"
      >
        <view class="head">
          <view class="time-lab corner" />
          <view
            v-for="day in days"
            :key="day"
            class="day-lab"
          >
            <text class="day-txt">{{ shortDay(day) }}</text>
          </view>
        </view>
        <view v-for="time in times" :key="time" class="row">
          <view class="time-lab">
            <text class="time-txt">{{ time }}</text>
          </view>
          <view
            v-for="day in days"
            :key="`${day}T${time}`"
            class="slot"
            :class="{ 'is-mine': mineSet.has(`${day}T${time}`) }"
            :style="{ backgroundColor: heat(counts[`${day}T${time}`] || 0) }"
            @touchstart="startPaint(`${day}T${time}`, $event)"
            @touchmove.stop="movePaint"
            @touchend="endPaint"
            @mousedown="startPaint(`${day}T${time}`, $event)"
          >
            <text v-if="counts[`${day}T${time}`]" class="n">
              {{ counts[`${day}T${time}`] }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.grid-box {
  width: 100%;
  overflow: hidden;
  background-color: #ffffff;
}
.time-grid {
  width: 100%;
  box-sizing: border-box;
  background-color: #ffffff;
}
.dark .time-grid {
  background-color: #121212;
}
.sheet {
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
}
.head,
.row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}
.time-lab,
.day-lab,
.slot {
  box-sizing: border-box;
  flex-shrink: 0;
}
.time-lab {
  width: 36px;
  min-width: 36px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
  background-color: #ffffff;
}
.dark .time-lab {
  background-color: #121212;
}
.corner {
  height: 20px;
}
.day-lab {
  width: 44px;
  min-width: 44px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}
.dark .day-lab {
  background-color: #121212;
}
.day-txt,
.time-txt {
  font-size: 10px;
  line-height: 1.2;
  color: #6b7280;
  text-align: right;
}
.day-txt {
  text-align: center;
}
.slot {
  width: 44px;
  min-width: 44px;
  height: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
}
.dark .slot {
  border-color: #4b5563;
  background-color: #1f2937;
}
.slot.is-mine {
  box-shadow: inset 0 0 0 2px #0f766e;
}
.n {
  font-size: 10px;
  color: #134e4a;
}
</style>
