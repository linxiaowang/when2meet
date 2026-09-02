<script setup lang="ts">
import type { SlotMinutes } from '~/shared/types'
import { createEvent } from '~/api/events'
import { eventPagePath } from '~/shared/share'
import { dateChip, upcomingDays } from '~/shared/time'

definePage({
  layout: 'home',
  style: {
    navigationBarTitleText: '约',
    enableShareAppMessage: true,
    enableShareTimeline: true,
  },
})

onShareAppMessage(() => ({
  title: '约',
  path: '/pages/index',
  imageUrl: '/static/share.png',
}))

onShareTimeline(() => ({
  title: '约',
  query: '',
  imageUrl: '/static/share.png',
}))

const title = ref('')
const dayOptions = upcomingDays(10)
const selectedDates = ref<string[]>(dayOptions.slice(0, 3))
const startHour = ref(9)
const endHour = ref(21)
const slotMinutes = ref<SlotMinutes>(60)
const submitting = ref(false)
const error = ref('')

function toggleDate(ymd: string) {
  const set = new Set(selectedDates.value)
  if (set.has(ymd))
    set.delete(ymd)
  else
    set.add(ymd)
  selectedDates.value = dayOptions.filter(day => set.has(day))
}

function shiftHour(target: 'start' | 'end', delta: number) {
  if (target === 'start')
    startHour.value = Math.min(23, Math.max(0, startHour.value + delta))
  else
    endHour.value = Math.min(24, Math.max(1, endHour.value + delta))
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

async function submit() {
  error.value = ''
  if (submitting.value)
    return
  submitting.value = true
  try {
    const event = await createEvent({
      title: title.value,
      dates: selectedDates.value,
      startHour: startHour.value,
      endHour: endHour.value,
      slotMinutes: slotMinutes.value,
    })
    uni.redirectTo({ url: eventPagePath(event.id) })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '创建失败'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="mx-auto max-w-md pb-8 text-left">
    <view class="mb-6">
      <view class="text-3xl text-teal-800 font-semibold">
        约
      </view>
      <view class="mt-1 text-sm text-gray-500">
        发一个链接，大家点自己能来的时间。
      </view>
    </view>

    <view class="mb-4">
      <view class="mb-1 text-sm text-gray-600">
        标题
      </view>
      <input
        v-model="title"
        class="box-border w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-base"
        placeholder="例如：周五晚饭"
        maxlength="80"
      >
    </view>

    <view class="mb-4">
      <view class="mb-1 text-sm text-gray-600">
        日期（上海时区）
      </view>
      <view class="flex flex-wrap gap-2">
        <view
          v-for="day in dayOptions"
          :key="day"
          class="rounded-full px-3 py-1.5 text-sm"
          :class="selectedDates.includes(day) ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-700'"
          @tap="toggleDate(day)"
        >
          {{ dateChip(day) }}
        </view>
      </view>
    </view>

    <view class="mb-4">
      <view class="mb-1 text-sm text-gray-600">
        每天时间
      </view>
      <view class="flex items-center justify-between gap-3">
        <view class="flex items-center gap-2">
          <view class="h-8 w-8 center rounded-full bg-gray-100 text-lg" @tap="shiftHour('start', -1)">
            −
          </view>
          <view class="min-w-14 text-center font-mono">
            {{ hourLabel(startHour) }}
          </view>
          <view class="h-8 w-8 center rounded-full bg-gray-100 text-lg" @tap="shiftHour('start', 1)">
            +
          </view>
        </view>
        <view class="text-gray-400">
          到
        </view>
        <view class="flex items-center gap-2">
          <view class="h-8 w-8 center rounded-full bg-gray-100 text-lg" @tap="shiftHour('end', -1)">
            −
          </view>
          <view class="min-w-14 text-center font-mono">
            {{ hourLabel(endHour) }}
          </view>
          <view class="h-8 w-8 center rounded-full bg-gray-100 text-lg" @tap="shiftHour('end', 1)">
            +
          </view>
        </view>
      </view>
    </view>

    <view class="mb-6">
      <view class="mb-1 text-sm text-gray-600">
        格子大小
      </view>
      <view class="flex gap-2">
        <view
          class="flex-1 rounded-lg py-2 text-center"
          :class="slotMinutes === 60 ? 'bg-teal-700 text-white' : 'bg-gray-100'"
          @tap="slotMinutes = 60"
        >
          60 分钟
        </view>
        <view
          class="flex-1 rounded-lg py-2 text-center"
          :class="slotMinutes === 30 ? 'bg-teal-700 text-white' : 'bg-gray-100'"
          @tap="slotMinutes = 30"
        >
          30 分钟
        </view>
      </view>
    </view>

    <view v-if="error" class="mb-3 text-sm text-red-600">
      {{ error }}
    </view>

    <button
      class="w-full rounded-lg bg-teal-700 py-2.5 text-white"
      :disabled="submitting"
      @tap="submit"
    >
      {{ submitting ? '生成中…' : '生成链接' }}
    </button>
  </view>
</template>
