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

async function toggle(key: string) {
  if (!event.value || !props.id)
    return
  const next = mine.value.includes(key)
    ? mine.value.filter(s => s !== key)
    : [...mine.value, key]
  saving.value = true
  try {
    event.value = await store.saveMine(props.id, name.value, next)
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

watchDebounced(name, async (value) => {
  if (!props.id || !event.value)
    return
  if (!mine.value.length && !event.value.participants.some(p => p.id === store.selfId))
    return
  event.value = await store.saveMine(props.id, value, mine.value)
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
onUnmounted(() => clearInterval(timer))
onUnload(() => clearInterval(timer))
</script>

<template>
  <div>
    <p text-3xl font-bold>
      {{ title }}
    </p>
    <p mt-1 text-sm italic op75>
      点格子标记你有空。颜色越深，重叠的人越多。
    </p>

    <div mt-4>
      <button m-3 btn text-sm @click="copyLink">
        复制分享链接
      </button>
      <button m-3 btn text-sm @click="router.back()">
        返回
      </button>
    </div>

    <TheInput
      v-model:value="name"
      placeholder="你的名字（可选）"
    />

    <p v-if="loading" mt-6 text-sm op70>
      正在打开这个约…
    </p>
    <p v-else-if="!event" mt-6 text-sm op70>
      没找到这个约。请让发起人重新发链接。
    </p>
    <div v-else mt-5>
      <TimeGrid
        :days="days"
        :times="times"
        :counts="counts"
        :mine="mine"
        :max-count="maxCount"
        @toggle="toggle"
      />
      <p mt-3 text-sm op80>
        已填：{{ people.length ? people.map(p => p.name).join('、') : '还没有人' }}
      </p>
      <p text-sm op80>
        重叠：{{ best }}
      </p>
      <p v-if="saving" mt-1 text-xs op50>
        正在保存…
      </p>
    </div>
  </div>
</template>
