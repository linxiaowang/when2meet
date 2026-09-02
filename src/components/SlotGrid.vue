<script setup lang="ts">
import type { YueEvent } from '~/shared/types'
import { countBySlot, eventTimes, heatmapColor, namesBySlot, slotKey } from '~/shared/slots'
import { weekdayZh } from '~/shared/time'

const props = defineProps<{
  event: YueEvent
  mine: string[]
  activeKey: string
}>()

const emit = defineEmits<{
  cellTap: [key: string]
}>()

const times = computed(() => eventTimes(props.event))
const counts = computed(() => countBySlot(props.event))
const maxCount = computed(() =>
  Math.max(1, props.event.responses.filter(item => item.slots.length > 0).length),
)

function keyOf(date: string, time: string) {
  return slotKey(date, time)
}

function bg(date: string, time: string) {
  const key = keyOf(date, time)
  const count = counts.value[key] || 0
  if (count <= 0)
    return props.mine.includes(key) ? '#99f6e4' : '#f4f4f5'
  return heatmapColor(count, maxCount.value)
}

function isMine(date: string, time: string) {
  return props.mine.includes(keyOf(date, time))
}

function isActive(date: string, time: string) {
  return props.activeKey === keyOf(date, time)
}

function onCellTap(date: string, time: string) {
  emit('cellTap', keyOf(date, time))
}

function namesHint(date: string, time: string) {
  const names = namesBySlot(props.event)[keyOf(date, time)] || []
  return names.length ? `${names.length}人` : ''
}
</script>

<template>
  <view class="w-full select-none overflow-x-auto">
    <view class="inline-flex pb-2">
      <view class="w-12 shrink-0">
        <view class="h-10" />
        <view
          v-for="time in times"
          :key="time"
          class="mb-0.5 h-9 flex items-center justify-end pr-1 text-xs text-gray-500 font-mono"
        >
          {{ time }}
        </view>
      </view>
      <view
        v-for="date in event.dates"
        :key="date"
        class="w-14 shrink-0"
      >
        <view class="h-10 flex flex-col items-center justify-center text-xs">
          <text>{{ date.slice(5).replace('-', '/') }}</text>
          <text class="text-gray-500">
            周{{ weekdayZh(date) }}
          </text>
        </view>
        <view
          v-for="time in times"
          :key="`${date}-${time}`"
          class="mx-0.5 mb-0.5 h-9 flex cursor-pointer items-center justify-center rounded-sm text-[10px]"
          :class="isMine(date, time) ? 'ring-2 ring-teal-800' : 'ring-1 ring-gray-200'"
          :style="{
            background: bg(date, time),
            outline: isActive(date, time) ? '2px solid #134e4a' : 'none',
          }"
          @tap="onCellTap(date, time)"
        >
          <text class="text-teal-950/80">
            {{ namesHint(date, time) }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>
