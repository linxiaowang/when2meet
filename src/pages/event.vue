<script setup lang="ts">
import type { YueEvent } from '~/stores/event'
import {
  eventDays,
  eventPath,
  eventTimes,
  h5ShareUrl,
  slotCounts,
  useEventStore,
} from '~/stores/event'

const props = defineProps<{ id?: string, t?: string }>()

definePage({
  style: {
    navigationBarTitleText: '约',
    navigationStyle: 'custom',
    disableScroll: true,
    enableShareAppMessage: true,
  },
})

const store = useEventStore()
const event = ref<YueEvent | null>(null)
const name = ref('')
const loading = ref(true)
const saving = ref(false)

const title = computed(() => event.value?.title || props.t || '约')
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
const best = computed(() => {
  let top = 0
  let label = ''
  for (const day of days.value) {
    for (const time of times.value) {
      const n = counts.value[`${day}T${time}`] || 0
      if (n > top) {
        top = n
        label = `${day.slice(5)} ${time}`
      }
    }
  }
  return top > 1 ? `${label}（${top} 人重叠）` : '再请别人填一下就能看到重叠'
})

onShareAppMessage(() => ({
  title: title.value,
  path: eventPath(props.id || ''),
  imageUrl: '/static/logo.png',
}))

async function refresh() {
  if (!props.id)
    return
  event.value = await store.loadEvent(props.id)
  const me = event.value?.participants.find(p => p.id === store.selfId)
  if (me?.name && me.name !== '匿名' && !name.value)
    name.value = me.name
}

async function paint(slots: string[]) {
  if (!event.value || !props.id)
    return
  saving.value = true
  try {
    event.value = await store.saveMine(props.id, name.value, slots)
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
  finally {
    saving.value = false
  }
}

function copyLink() {
  if (!props.id)
    return
  uni.setClipboardData({
    data: h5ShareUrl(props.id),
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
  })
}

watchDebounced(name, async () => {
  await saveName()
}, { debounce: 600 })

onLoad(async (query) => {
  loading.value = true
  if (!props.id && query?.id)
    await store.loadEvent(String(query.id)).then((e) => { event.value = e })
  else
    await refresh()
  loading.value = false
})

onMounted(async () => {
  if (typeof document !== 'undefined')
    document.documentElement.classList.add('yue-lock')
  if (!event.value) {
    loading.value = true
    await refresh()
    loading.value = false
  }
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
  <div class="event">
    <p class="brand">
      {{ title }}
    </p>
    <p class="lead">
      按住格子滑动涂你有空的时间。颜色越深，重叠的人越多。
    </p>

    <div class="toolbar">
      <input
        v-model="name"
        class="name"
        type="text"
        placeholder="你的名字（可选）"
        confirm-type="done"
      >
      <button class="act" :disabled="saving" @click="saveName">
        {{ saving ? '保存中…' : '保存' }}
      </button>
      <button class="act" @click="copyLink">
        复制
      </button>
    </div>

    <p v-if="loading" class="note">
      正在打开这个约…
    </p>
    <p v-else-if="!event" class="note">
      没找到这个约。请让发起人重新发链接。
    </p>
    <div v-else class="body">
      <p class="status">
        已填：{{ people.length ? people.map(p => p.name).join('、') : '还没有人' }}
        ·
        {{ best }}
      </p>
      <TimeGrid
        :days="days"
        :times="times"
        :counts="counts"
        :mine="mine"
        :max-count="maxCount"
        @paint="paint"
      />
    </div>
  </div>
</template>

<style scoped>
.event {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  text-align: left;
  overflow: hidden;
}
.brand {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  flex-shrink: 0;
}
.lead {
  margin: 4px 0 8px;
  font-size: 12px;
  line-height: 1.4;
  opacity: 0.75;
  flex-shrink: 0;
}
.toolbar {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  margin: 0 0 8px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.name {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 40px;
  box-sizing: border-box;
  padding: 8px 10px;
  font-size: 16px;
  color: inherit;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
}
.dark .name {
  border-color: #4b5563;
}
.act {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 8px 10px;
  font-size: 14px;
  color: #fff;
  background: #0d9488;
  border: 0;
  border-radius: 6px;
  white-space: nowrap;
}
.act:disabled {
  opacity: 0.5;
}
.body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 0;
}
.status,
.note {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.4;
  opacity: 0.8;
  flex-shrink: 0;
}
</style>
