<script setup lang="ts">
import type { YueEvent } from '~/stores/event'
import YueHeader from '~/components/YueHeader.vue'
import { useSafePad } from '~/composables/useSafePad'
import {
  eventDays,
  eventPath,
  eventTimes,
  slotCounts,
  useEventStore,
} from '~/stores/event'

const props = defineProps<{ id?: string, t?: string }>()

definePage({
  style: {
    navigationBarTitleText: '约个空',
    navigationStyle: 'custom',
    disableScroll: true,
    enableShareAppMessage: true,
  },
})

const store = useEventStore()
const { padTop, padBottom, windowHeight, read } = useSafePad()
const event = ref<YueEvent | null>(null)
const name = ref('')
const loading = ref(true)
const saving = ref(false)
const gridHeight = ref(360)

const title = computed(() => event.value?.title || props.t || '约个空')
const days = computed(() => event.value ? eventDays(event.value) : [])
const times = computed(() => event.value ? eventTimes(event.value) : [])
const counts = computed(() => event.value ? slotCounts(event.value) : {})
const maxCount = computed(() => Math.max(0, ...Object.values(counts.value), 0))
const mine = computed(() => {
  if (!event.value)
    return []
  return event.value.participants.find(p => p.id === store.selfId)?.slots || []
})
const people = computed(() => event.value?.participants.filter(p => p.slots.length) || [])
const peopleLine = computed(() => people.value.length ? people.value.map(p => p.name).join('、') : '还没有人')

function shortMd(iso: string) {
  const parts = iso.split('-')
  return `${Number(parts[1])}/${Number(parts[2])}`
}

function addMinutes(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const best = computed(() => {
  const top = maxCount.value
  if (top <= 1)
    return '再请别人填一下就能看到重叠'
  const step = event.value?.slotMinutes || 30
  let bestLen = 0
  let label = ''
  for (const day of days.value) {
    let runStart = ''
    let runLen = 0
    let lastTime = ''
    const flush = () => {
      if (!runLen)
        return
      if (runLen > bestLen) {
        bestLen = runLen
        label = `${shortMd(day)} ${runStart}–${addMinutes(lastTime, step)}`
      }
      runStart = ''
      runLen = 0
      lastTime = ''
    }
    for (const time of times.value) {
      const n = counts.value[`${day}T${time}`] || 0
      if (n === top) {
        if (!runLen)
          runStart = time
        runLen++
        lastTime = time
      }
      else {
        flush()
      }
    }
    flush()
  }
  return label ? `${label}（${top} 人重叠）` : '再请别人填一下就能看到重叠'
})

onShareAppMessage(() => ({
  title: title.value,
  path: eventPath(props.id || ''),
  imageUrl: '/static/logo.png',
}))

function measureGrid() {
  read()
  const chrome = padTop.value + 176 + (padBottom.value || 8)
  gridHeight.value = Math.max(320, Math.floor(windowHeight.value - chrome))
}

measureGrid()

function prefillOwnName() {
  const me = event.value?.participants.find(p => p.id === store.selfId)
  if (me?.name && me.name !== '匿名' && !name.value)
    name.value = me.name
}

async function refresh() {
  if (!props.id)
    return
  event.value = await store.loadEvent(props.id)
  prefillOwnName()
  measureGrid()
}

async function paint(slots: string[]) {
  if (!event.value || !props.id)
    return
  saving.value = true
  try {
    event.value = await store.saveMine(props.id, name.value, slots)
  }
  catch {
    uni.showToast({ title: '没存上，请检查云开发', icon: 'none' })
  }
  finally {
    saving.value = false
  }
}

async function saveName() {
  if (!props.id || !event.value)
    return
  if (!mine.value.length && !event.value.participants.some(p => p.id === store.selfId))
    return
  saving.value = true
  try {
    event.value = await store.saveMine(props.id, name.value, mine.value)
  }
  catch {
    uni.showToast({ title: '没存上，请检查云开发', icon: 'none' })
  }
  finally {
    saving.value = false
  }
}

watchDebounced(name, async () => {
  await saveName()
}, { debounce: 600 })

onLoad(async (query) => {
  loading.value = true
  read()
  if (!props.id && query?.id)
    await store.loadEvent(String(query.id)).then((e) => { event.value = e })
  else
    await refresh()
  prefillOwnName()
  loading.value = false
  measureGrid()
})

onReady(() => {
  measureGrid()
})

onMounted(async () => {
  if (typeof document !== 'undefined')
    document.documentElement.classList.add('yue-lock')
  if (!event.value) {
    loading.value = true
    await refresh()
    loading.value = false
  }
  measureGrid()
})

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(refresh, 8000)
})
onUnmounted(() => {
  if (typeof document !== 'undefined')
    document.documentElement.classList.remove('yue-lock')
  clearInterval(timer)
})
onUnload(() => {
  if (typeof document !== 'undefined')
    document.documentElement.classList.remove('yue-lock')
  clearInterval(timer)
})
</script>

<template>
  <view
    class="event"
    :style="{ height: `${windowHeight}px` }"
  >
    <YueHeader :title="title" :show-back="true" />

    <view class="content">
      <text class="lead">按住格子滑动涂你有空的时间。颜色越深，重叠的人越多。</text>

      <view class="name-row">
        <input
          v-model="name"
          class="name"
          type="text"
          placeholder="你的名字（可选）"
          placeholder-class="ph"
          placeholder-style="font-size:16px;color:#9ca3af;line-height:44px;"
          confirm-type="done"
        >
      </view>

      <view class="actions">
        <button class="act" hover-class="act-hover" open-type="share">
          <text class="act-txt">分享</text>
        </button>
      </view>

      <text v-if="loading" class="note">正在打开这个约…</text>
      <text v-else-if="!event" class="note">没找到这个约。请让发起人重新发链接。</text>
      <view v-else class="body">
        <text class="status">已填：{{ peopleLine }} · {{ best }}</text>
        <view class="grid-wrap" :style="{ height: `${gridHeight}px` }">
          <TimeGrid
            :days="days"
            :times="times"
            :counts="counts"
            :mine="mine"
            :max-count="maxCount"
            :height="gridHeight"
            @paint="paint"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.event {
  box-sizing: border-box;
  overflow: hidden;
}
.content {
  padding-left: 12px;
  padding-right: 12px;
}
.lead {
  display: block;
  margin: 10px 0 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #4b5563;
  flex-shrink: 0;
}
.dark .lead {
  color: #d1d5db;
}
.name-row {
  flex-shrink: 0;
  margin: 0 0 8px;
}
.name {
  display: block;
  width: 100%;
  height: 44px;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0 12px;
  font-size: 16px;
  line-height: 44px;
  color: #111827;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}
.dark .name {
  color: #f9fafb;
  background-color: #1f2937;
  border-color: #4b5563;
}
.ph {
  font-size: 16px;
  line-height: 44px;
  color: #9ca3af;
}
.actions {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  margin: 0 0 8px;
}
.act {
  flex: 1;
  height: 40px;
  margin: 0 6px 0 0;
  padding: 0;
  line-height: 40px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff !important;
  background-color: #0d9488 !important;
  border: none;
  border-radius: 8px;
}
.act:last-child {
  margin-right: 0;
}
.act::after {
  border: none;
}
.act-hover {
  opacity: 0.88;
}
.act-txt {
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}
.body {
  overflow: hidden;
}
.status,
.note {
  display: block;
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.45;
  color: #4b5563;
  flex-shrink: 0;
}
.dark .status,
.dark .note {
  color: #d1d5db;
}
.grid-wrap {
  width: 100%;
}
</style>
