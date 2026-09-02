<script setup lang="ts">
import type { YueEvent } from '~/shared/types'
import { getEvent, saveResponse } from '~/api/events'
import { currentHref, eventPagePath, shareAppMessage, shareTimeline } from '~/shared/share'
import { countBySlot, namesBySlot, parseSlotKey } from '~/shared/slots'
import { dateChip } from '~/shared/time'

definePage({
  style: {
    navigationBarTitleText: '约',
    enableShareAppMessage: true,
    enableShareTimeline: true,
  },
})

const eventId = ref('')
const event = ref<YueEvent | null>(null)
const name = ref('')
const mySlots = ref<Set<string>>(new Set())
const activeKey = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const savedHint = ref('')
const dirty = ref(false)

const preview = computed<YueEvent | null>(() => {
  if (!event.value)
    return null
  const who = name.value.trim()
  const others = event.value.responses.filter(item => item.name !== who)
  const mine = who
    ? [{ name: who, slots: [...mySlots.value], updatedAt: event.value.createdAt }]
    : []
  return { ...event.value, responses: [...others, ...mine] }
})

const peopleCount = computed(() => event.value?.responses.length || 0)

const overlap = computed(() => {
  if (!preview.value || preview.value.responses.length < 2)
    return []
  const counts = countBySlot(preview.value)
  const need = preview.value.responses.length
  return Object.keys(counts)
    .filter(key => counts[key] === need)
    .sort()
})

const activeNames = computed(() => {
  if (!preview.value || !activeKey.value)
    return []
  return namesBySlot(preview.value)[activeKey.value] || []
})

const activeLabel = computed(() => {
  const parsed = parseSlotKey(activeKey.value)
  if (!parsed)
    return ''
  return `${dateChip(parsed.date)} ${parsed.time}`
})

const shareLink = computed(() => {
  if (!eventId.value)
    return ''
  return currentHref() || eventPagePath(eventId.value)
})

onShareAppMessage(() => shareAppMessage(event.value))
onShareTimeline(() => shareTimeline(event.value))

onLoad((query) => {
  eventId.value = String(query?.id || '')
  load()
})

onShow(() => {
  if (eventId.value && !loading.value)
    load({ silent: true })
})

async function load(opts?: { silent?: boolean }) {
  if (!eventId.value) {
    loading.value = false
    error.value = '链接缺少 id'
    return
  }
  if (!opts?.silent)
    loading.value = true
  error.value = ''
  try {
    const data = await getEvent(eventId.value)
    event.value = data
    uni.setNavigationBarTitle({ title: data.title || '约' })
    const who = name.value.trim()
    if (who) {
      const mine = data.responses.find(item => item.name === who)
      if (mine && !dirty.value)
        mySlots.value = new Set(mine.slots)
    }
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  }
  finally {
    loading.value = false
  }
}

function onNameBlur() {
  const who = name.value.trim()
  name.value = who
  if (!event.value || dirty.value)
    return
  const mine = event.value.responses.find(item => item.name === who)
  mySlots.value = new Set(mine?.slots || [])
}

function onTapCell(key: string) {
  activeKey.value = key
  const who = name.value.trim()
  if (!who) {
    uni.showToast({ title: '先填一个名字', icon: 'none' })
    return
  }
  const next = new Set(mySlots.value)
  if (next.has(key))
    next.delete(key)
  else
    next.add(key)
  mySlots.value = next
  dirty.value = true
  savedHint.value = ''
}

async function save() {
  if (!eventId.value)
    return
  const who = name.value.trim()
  if (!who) {
    uni.showToast({ title: '先填一个名字', icon: 'none' })
    return
  }
  saving.value = true
  error.value = ''
  try {
    const data = await saveResponse(eventId.value, {
      name: who,
      slots: [...mySlots.value],
    })
    event.value = data
    dirty.value = false
    savedHint.value = '已保存，别人刷新就能看到'
    uni.showToast({ title: '已保存', icon: 'none' })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '保存失败'
  }
  finally {
    saving.value = false
  }
}

function copyLink() {
  const url = shareLink.value
  if (!url)
    return
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
  })
}

function goCreate() {
  uni.reLaunch({ url: '/pages/index' })
}
</script>

<template>
  <view class="mx-auto max-w-md pb-24 text-left">
    <view v-if="loading" class="py-20 text-center text-gray-500">
      加载中…
    </view>

    <view v-else-if="!event" class="py-12 text-center">
      <view class="mb-3 text-gray-600">
        {{ error || '找不到这个约' }}
      </view>
      <button class="rounded-lg bg-teal-700 px-4 py-2 text-white" @tap="goCreate">
        去创建一个
      </button>
    </view>

    <view v-else>
      <view class="mb-3">
        <view class="text-2xl text-teal-900 font-semibold">
          {{ event.title }}
        </view>
        <view class="mt-1 text-sm text-gray-500">
          {{ peopleCount }} 人已填 · 上海时区
        </view>
      </view>

      <view class="mb-3 flex items-center gap-2">
        <view class="min-w-0 flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
          {{ shareLink }}
        </view>
        <view class="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm text-white" @tap="copyLink">
          复制
        </view>
      </view>

      <view class="mb-3">
        <view class="mb-1 text-sm text-gray-600">
          你的名字（不用登录）
        </view>
        <input
          v-model="name"
          class="box-border w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-base"
          placeholder="怎么称呼你"
          maxlength="20"
          @blur="onNameBlur"
        >
      </view>

      <view v-if="overlap.length" class="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
        大家都有空：
        <text v-for="(key, i) in overlap.slice(0, 8)" :key="key">
          {{ i ? '、' : '' }}{{ dateChip(parseSlotKey(key)!.date) }} {{ parseSlotKey(key)!.time }}
        </text>
        <text v-if="overlap.length > 8">
          等 {{ overlap.length }} 格
        </text>
      </view>

      <view class="mb-1 text-sm text-gray-600">
        点格子：绿得越深人越多。描边是你选的。
      </view>

      <SlotGrid
        :event="preview || event"
        :mine="mySlots"
        :active-key="activeKey"
        @tap="onTapCell"
      />

      <view class="mt-2 min-h-10 text-sm text-gray-700">
        <text v-if="activeKey">
          {{ activeLabel }}：
          {{ activeNames.length ? activeNames.join('、') : '还没人' }}
        </text>
        <text v-else class="text-gray-400">
          点一格看谁有空
        </text>
      </view>

      <view v-if="event.responses.length" class="mt-2 text-sm text-gray-500">
        已填：{{ event.responses.map(item => item.name).join('、') }}
      </view>

      <view v-if="error" class="mt-2 text-sm text-red-600">
        {{ error }}
      </view>
      <view v-else-if="savedHint" class="mt-2 text-sm text-teal-700">
        {{ savedHint }}
      </view>
      <view v-else-if="dirty" class="mt-2 text-sm text-amber-700">
        还没保存
      </view>

      <view class="mt-4 text-center text-sm text-teal-800" @tap="goCreate">
        再约一个
      </view>
    </view>

    <view
      v-if="event"
      class="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3"
    >
      <button
        class="w-full rounded-lg bg-teal-700 py-2.5 text-white"
        :disabled="saving"
        @tap="save"
      >
        {{ saving ? '保存中…' : '保存我的时间' }}
      </button>
    </view>
  </view>
</template>
