<script setup lang="ts">
import { inputValue } from '~/utils/input'
import { createEvent } from '~/utils/store'
import { dayChipLabel, HOUR_OPTIONS, upcomingDates } from '~/utils/time'

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '约',
  },
})

const title = ref('')
const candidates = upcomingDates(14)
const selectedDates = ref<string[]>(candidates.slice(0, 2))
const startHour = ref(9)
const endHour = ref(21)
const slotMinutes = ref<30 | 60>(60)
const submitting = ref(false)

function onTitleInput(e: unknown) {
  title.value = inputValue(e)
}

function toggleDate(iso: string) {
  const i = selectedDates.value.indexOf(iso)
  if (i >= 0)
    selectedDates.value.splice(i, 1)
  else
    selectedDates.value = [...selectedDates.value, iso].sort()
}

function isSelected(iso: string) {
  return selectedDates.value.includes(iso)
}

async function onCreate() {
  if (submitting.value)
    return
  if (!selectedDates.value.length) {
    uni.showToast({ title: '请先选几天', icon: 'none' })
    return
  }
  if (startHour.value >= endHour.value) {
    uni.showToast({ title: '结束时间要晚于开始', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const event = await createEvent({
      title: title.value.trim() || '未命名',
      dates: [...selectedDates.value].sort(),
      startHour: Number(startHour.value),
      endHour: Number(endHour.value),
      slotMinutes: slotMinutes.value,
      timezone: 'Asia/Shanghai',
      participants: [],
      createdAt: new Date().toISOString(),
    })
    uni.navigateTo({ url: `/pages/event?id=${event.id}` })
  }
  catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '创建失败', icon: 'none' })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div text-left>
    <h1 text-2xl font-bold>
      约
    </h1>
    <p mt-1 text-sm op-60>
      选几天、圈时段，把链接发出去。重叠的格子就是都能到的时间。
    </p>

    <label mt-5 block text-sm font-medium>标题</label>
    <input
      class="field"
      :value="title"
      placeholder="未命名"
      maxlength="40"
      @input="onTitleInput"
    >

    <div mt-5 text-sm font-medium>
      选几天 <span font-normal op-50>（上海时区）</span>
    </div>
    <div mt-2 flex flex-wrap gap-2>
      <button
        v-for="d in candidates"
        :key="d"
        type="button"
        class="chip"
        :class="isSelected(d) ? 'chip-on' : ''"
        @click="toggleDate(d)"
      >
        {{ dayChipLabel(d) }}
      </button>
    </div>

    <div mt-5 text-sm font-medium>
      小时范围
    </div>
    <div mt-2 flex items-center gap-2>
      <select v-model.number="startHour" class="field flex-1">
        <option v-for="h in HOUR_OPTIONS" :key="`s${h}`" :value="h">
          {{ String(h).padStart(2, '0') }}:00
        </option>
      </select>
      <span op-50>至</span>
      <select v-model.number="endHour" class="field flex-1">
        <option v-for="h in HOUR_OPTIONS" :key="`e${h}`" :value="h">
          {{ String(h).padStart(2, '0') }}:00
        </option>
      </select>
    </div>

    <div mt-5 text-sm font-medium>
      格子粒度
    </div>
    <div mt-2 flex gap-2>
      <button
        type="button"
        class="chip"
        :class="slotMinutes === 30 ? 'chip-on' : ''"
        @click="slotMinutes = 30"
      >
        30 分钟
      </button>
      <button
        type="button"
        class="chip"
        :class="slotMinutes === 60 ? 'chip-on' : ''"
        @click="slotMinutes = 60"
      >
        60 分钟
      </button>
    </div>

    <button
      mt-8 btn w-full py-3 text-base
      :disabled="submitting"
      @click="onCreate"
    >
      {{ submitting ? '生成中…' : '生成链接' }}
    </button>
  </div>
</template>
