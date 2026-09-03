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

const draft = ref(new Set(props.mine))
const painting = ref(false)
const paintOn = ref(true)

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

function applyKey(key: string) {
  if (!key)
    return
  const next = new Set(draft.value)
  if (paintOn.value)
    next.add(key)
  else
    next.delete(key)
  draft.value = next
}

function startPaint(key: string) {
  if (!key || painting.value)
    return
  painting.value = true
  paintOn.value = !draft.value.has(key)
  applyKey(key)
}

function slotFromPoint(x: number, y: number) {
  if (typeof document === 'undefined')
    return ''
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  const cell = el?.closest?.('[data-slot]') as HTMLElement | null
  return cell?.dataset?.slot || ''
}

function pointOf(e: TouchEvent | MouseEvent) {
  const t = 'touches' in e ? e.touches[0] || e.changedTouches?.[0] : e
  return t ? { x: t.clientX, y: t.clientY } : null
}

function onGridStart(e: TouchEvent | MouseEvent) {
  const pt = pointOf(e)
  if (!pt)
    return
  const key = slotFromPoint(pt.x, pt.y)
  if (!key)
    return
  e.preventDefault()
  startPaint(key)
}

function onGridMove(e: TouchEvent | MouseEvent) {
  if (!painting.value)
    return
  e.preventDefault()
  const pt = pointOf(e)
  if (!pt)
    return
  applyKey(slotFromPoint(pt.x, pt.y))
}

function endPaint() {
  if (!painting.value)
    return
  painting.value = false
  emit('paint', [...draft.value])
}

onMounted(() => {
  if (typeof window === 'undefined')
    return
  window.addEventListener('mouseup', endPaint)
  window.addEventListener('touchend', endPaint)
  window.addEventListener('touchcancel', endPaint)
})

onUnmounted(() => {
  if (typeof window === 'undefined')
    return
  window.removeEventListener('mouseup', endPaint)
  window.removeEventListener('touchend', endPaint)
  window.removeEventListener('touchcancel', endPaint)
})
</script>

<template>
  <div
    class="time-grid"
    overflow-x-auto text-left
    @mousedown="onGridStart"
    @mousemove="onGridMove"
    @touchstart="onGridStart"
    @touchmove="onGridMove"
  >
    <div min-w-max>
      <div flex>
        <div class="time-lab" />
        <div
          v-for="day in days"
          :key="day"
          class="day-lab"
        >
          {{ shortDay(day) }}
        </div>
      </div>
      <div v-for="time in times" :key="time" flex items-stretch>
        <div class="time-lab" op70>
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
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  user-select: none;
  -webkit-user-select: none;
}
.time-lab,
.day-lab {
  width: 72px;
  min-width: 72px;
  flex-shrink: 0;
  box-sizing: border-box;
}
.time-lab {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 12px;
}
.day-lab {
  padding: 8px 4px;
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
  margin: 3px;
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
.dark .slot {
  border-color: #374151;
}
.slot.is-mine {
  box-shadow: inset 0 0 0 3px #0f766e;
}
</style>
