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
const hourLabels = hours.map(h => `${String(h).padStart(2, '0')}:00`)
const dayChoices = [3, 7, 14]
const dayLabels = ['3 天', '7 天', '14 天']

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
  <div class="create">
    <p class="brand">
      约
    </p>
    <p class="lead">
      建一个约会，把链接发给别人，一起涂格子找重叠空档。
    </p>

    <label class="lab">主题</label>
    <input
      v-model="title"
      class="field"
      type="text"
      placeholder="比如周五晚饭"
      confirm-type="done"
    >

    <p class="lab">
      从哪天开始
    </p>
    <picker mode="date" :value="startDate" @change="startDate = $event.detail.value">
      <div class="field tap">
        {{ startDate }}
      </div>
    </picker>

    <p class="lab">
      持续几天
    </p>
    <picker :value="dayChoices.indexOf(dayCount)" :range="dayLabels" @change="dayCount = dayChoices[Number($event.detail.value)]">
      <div class="field tap">
        {{ dayCount }} 天
      </div>
    </picker>

    <p class="lab">
      每天时间段
    </p>
    <div class="row">
      <picker class="grow" :value="startHour" :range="hourLabels" @change="startHour = Number($event.detail.value)">
        <div class="field tap">
          {{ hourLabels[startHour] }}
        </div>
      </picker>
      <span class="to">到</span>
      <picker class="grow" :value="endHour" :range="hourLabels" @change="endHour = Number($event.detail.value)">
        <div class="field tap">
          {{ hourLabels[endHour] }}
        </div>
      </picker>
    </div>

    <button
      class="go"
      :disabled="!title.trim() || creating"
      @click="create"
    >
      {{ creating ? '创建中…' : '发起约' }}
    </button>
  </div>
</template>

<style scoped>
.create {
  max-width: 420px;
  text-align: left;
}
.brand {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}
.lead {
  margin: 8px 0 20px;
  font-size: 14px;
  opacity: 0.75;
}
.lab {
  display: block;
  margin: 14px 0 6px;
  font-size: 13px;
  opacity: 0.8;
}
.field {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 12px;
  font-size: 16px;
  line-height: 1.4;
  color: inherit;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
}
.dark .field {
  border-color: #4b5563;
}
.tap {
  min-height: 44px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.grow {
  flex: 1;
  min-width: 0;
}
.to {
  opacity: 0.6;
  font-size: 13px;
}
.go {
  display: block;
  width: 100%;
  margin: 24px 0 0;
  padding: 14px 12px;
  font-size: 16px;
  color: #fff;
  background: #0d9488;
  border: 0;
  border-radius: 6px;
}
.go:disabled {
  opacity: 0.5;
}
</style>
