<script setup lang="ts">
import { eventPath, todayIso, useEventStore } from '~/stores/event'

definePage({
  layout: 'home',
  style: {
    navigationBarTitleText: '约',
    enableShareAppMessage: true,
  },
})

const store = useEventStore()
const title = ref('')
const startDate = ref(todayIso())
const dayCount = ref(7)
const startHour = ref(9)
const endHour = ref(21)
const creating = ref(false)
const hours = Array.from({ length: 24 }, (_, i) => i)

onShareAppMessage(() => ({
  title: title.value || '约',
  path: '/pages/index',
  imageUrl: '/static/logo.png',
}))

async function create() {
  const theme = title.value.trim()
  if (!theme || creating.value)
    return
  if (endHour.value <= startHour.value) {
    uni.showToast({ title: '结束时间要晚于开始时间', icon: 'none' })
    return
  }
  creating.value = true
  try {
    const event = await store.createEvent({
      title: theme,
      startDate: startDate.value,
      dayCount: dayCount.value,
      startHour: startHour.value,
      endHour: endHour.value,
      slotMinutes: 30,
    })
    router.push(`${eventPath(event.id)}&t=${event.title}`)
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <p text-4xl font-bold>
      约
    </p>
    <p mt-2 text-sm italic op75>
      发起一个约，把链接发给别人，点格子找重叠空档。
    </p>

    <div py-4 />

    <TheInput
      v-model:value="title"
      placeholder="主题，比如周五晚饭"
    />

    <div mt-4 flex flex-wrap items-center justify-center gap-3 text-sm>
      <picker mode="date" :value="startDate" @change="startDate = $event.detail.value">
        <div border="~ solid rd gray-200 dark:gray-700" px-3 py-2>
          开始 {{ startDate }}
        </div>
      </picker>
      <picker :value="[3, 7, 14].indexOf(dayCount)" :range="['3 天', '7 天', '14 天']" @change="dayCount = [3, 7, 14][Number($event.detail.value)]">
        <div border="~ solid rd gray-200 dark:gray-700" px-3 py-2>
          {{ dayCount }} 天
        </div>
      </picker>
    </div>

    <div mt-3 flex items-center justify-center gap-3 text-sm>
      <picker :value="startHour" :range="hours" @change="startHour = Number($event.detail.value)">
        <div border="~ solid rd gray-200 dark:gray-700" px-3 py-2>
          {{ String(startHour).padStart(2, '0') }}:00
        </div>
      </picker>
      <span op60>至</span>
      <picker :value="endHour" :range="hours" @change="endHour = Number($event.detail.value)">
        <div border="~ solid rd gray-200 dark:gray-700" px-3 py-2>
          {{ String(endHour).padStart(2, '0') }}:00
        </div>
      </picker>
    </div>

    <div>
      <button
        m-3 btn text-sm
        :disabled="!title.trim() || creating"
        @click="create"
      >
        {{ creating ? '创建中…' : '发起约' }}
      </button>
    </div>
  </div>
</template>
