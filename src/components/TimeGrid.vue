<script setup lang="ts">
const props = defineProps<{
  days: string[]
  times: string[]
  counts: Record<string, number>
  mine: string[]
  maxCount: number
}>()

const emit = defineEmits<{
  toggle: [key: string]
}>()

const mineSet = computed(() => new Set(props.mine))

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

function onTap(day: string, time: string) {
  emit('toggle', `${day}T${time}`)
}
</script>

<template>
  <div overflow-x-auto text-left>
    <div min-w-max>
      <div flex>
        <div w-14 shrink-0 />
        <div
          v-for="day in days"
          :key="day"
          w-11 shrink-0 px-0.5 text-center text-xs leading-tight op80
        >
          {{ shortDay(day) }}
        </div>
      </div>
      <div v-for="time in times" :key="time" flex items-stretch>
        <div w-14 shrink-0 py-1 pr-1 text-right text-xs op70>
          {{ time }}
        </div>
        <div
          v-for="day in days"
          :key="`${day}T${time}`"
          h-8 w-11 center shrink-0 border="~ solid gray-200 dark:gray-700"
          :class="mineSet.has(`${day}T${time}`) ? 'ring-1 ring-inset ring-teal-700' : ''"
          :style="{ background: heat(counts[`${day}T${time}`] || 0) }"
          @click="onTap(day, time)"
        >
          <span v-if="counts[`${day}T${time}`]" text-xs>
            {{ counts[`${day}T${time}`] }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
