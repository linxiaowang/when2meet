<script setup lang="ts">
import { useSafePad } from '~/composables/useSafePad'
import { eventPath, todayIso, useEventStore } from '~/stores/event'

definePage({
  layout: 'home',
  style: {
    navigationBarTitleText: '约',
    navigationStyle: 'custom',
    enableShareAppMessage: true,
  },
})

const store = useEventStore()
const { padBottom } = useSafePad()
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

const canCreate = computed(() => Boolean(title.value.trim()) && !creating.value)

onShareAppMessage(() => ({
  title: title.value || '约',
  path: '/pages/index',
  imageUrl: '/static/logo.png',
}))

function onStartDate(e: any) {
  startDate.value = String(e.detail.value)
}

function onDayCount(e: any) {
  dayCount.value = dayChoices[Number(e.detail.value)] ?? 7
}

function onStartHour(e: any) {
  startHour.value = Number(e.detail.value)
}

function onEndHour(e: any) {
  endHour.value = Number(e.detail.value)
}

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
  catch {
    uni.showToast({ title: '创建失败，约没有发出去', icon: 'none' })
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <view
    class="create"
    :style="{
      paddingBottom: `${Math.max(24, padBottom + 16)}px`,
    }"
  >
    <YueHeader title="约" />

    <text class="lead">建一个约会，把链接发给别人，一起涂格子找重叠空档。</text>

    <text class="lab">主题</text>
    <input
      v-model="title"
      class="field"
      type="text"
      placeholder="比如周五晚饭"
      placeholder-class="ph"
      placeholder-style="font-size:16px;color:#9ca3af;line-height:48px;"
      confirm-type="done"
    >

    <text class="lab">从哪天开始</text>
    <picker mode="date" :value="startDate" @change="onStartDate">
      <view class="field tap">
        <text>{{ startDate }}</text>
      </view>
    </picker>

    <text class="lab">持续几天</text>
    <picker :value="dayChoices.indexOf(dayCount)" :range="dayLabels" @change="onDayCount">
      <view class="field tap">
        <text>{{ dayCount }} 天</text>
      </view>
    </picker>

    <text class="lab">每天时间段</text>
    <view class="row">
      <picker class="grow" :value="startHour" :range="hourLabels" @change="onStartHour">
        <view class="field tap">
          <text>{{ hourLabels[startHour] }}</text>
        </view>
      </picker>
      <text class="to">到</text>
      <picker class="grow" :value="endHour" :range="hourLabels" @change="onEndHour">
        <view class="field tap">
          <text>{{ hourLabels[endHour] }}</text>
        </view>
      </picker>
    </view>

    <button
      class="go"
      :class="{ 'is-wait': !canCreate }"
      hover-class="go-hover"
      @click="create"
    >
      <text class="go-txt">{{ creating ? '创建中…' : '发起约' }}</text>
    </button>
  </view>
</template>

<style scoped>
.create {
  max-width: 420px;
  padding-left: 16px;
  padding-right: 16px;
  text-align: left;
  box-sizing: border-box;
}
.lead {
  display: block;
  margin: 12px 0 8px;
  font-size: 14px;
  line-height: 1.55;
  color: #4b5563;
}
.dark .lead {
  color: #d1d5db;
}
.lab {
  display: block;
  margin: 16px 0 8px;
  font-size: 13px;
  line-height: 1.4;
  color: #4b5563;
}
.dark .lab {
  color: #d1d5db;
}
.field {
  display: block;
  width: 100%;
  height: 48px;
  min-height: 48px;
  box-sizing: border-box;
  padding: 0 12px;
  font-size: 16px;
  line-height: 48px;
  color: #111827;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}
.dark .field {
  color: #f9fafb;
  background-color: #1f2937;
  border-color: #4b5563;
}
.ph {
  font-size: 16px;
  line-height: 48px;
  color: #9ca3af;
}
.tap {
  display: flex;
  align-items: center;
}
.row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.grow {
  flex: 1;
  min-width: 0;
}
.to {
  margin: 0 8px;
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}
.go {
  display: block;
  width: 100%;
  height: 48px;
  margin: 28px 0 0;
  padding: 0;
  line-height: 48px;
  font-size: 17px;
  font-weight: 600;
  color: #ffffff !important;
  background-color: #0d9488 !important;
  border: none;
  border-radius: 8px;
}
.go::after {
  border: none;
}
.go-hover {
  opacity: 0.88;
}
.go-txt {
  color: #ffffff;
  font-size: 17px;
  font-weight: 600;
}
.go.is-wait {
  background-color: #0f766e !important;
  color: #ffffff !important;
  opacity: 1;
}
.go.is-wait .go-txt {
  color: #ffffff;
}
</style>
