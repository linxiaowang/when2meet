<script setup lang="ts">
import type { YueEvent } from '~/utils/store'
import { inputValue } from '~/utils/input'
import { buildShareUrl, getEvent, saveParticipant } from '~/utils/store'
import { dayHeaderLabel, slotKey, slotTimes } from '~/utils/time'

definePage({
  style: {
    navigationBarTitleText: '约',
  },
})

const NAME_KEY = 'yue-display-name'

const eventId = ref('')
const event = ref<YueEvent | null>(null)
const loading = ref(true)
const error = ref('')
const displayName = ref('')
const mySlots = ref<string[]>([])
const saving = ref(false)
const dirty = ref(false)
const selectedKey = ref('')

const shareUrl = computed(() => eventId.value ? buildShareUrl(eventId.value) : '')

const times = computed(() => {
  if (!event.value)
    return []
  return slotTimes(event.value.startHour, event.value.endHour, event.value.slotMinutes)
})

const heatmapMax = computed(() => {
  const n = event.value?.participants.length || 0
  const hasMe = displayName.value.trim() && !event.value?.participants.some(p => p.name === displayName.value.trim())
  return Math.max(1, n + (hasMe ? 1 : 0))
})

const peopleLine = computed(() => {
  if (!event.value)
    return ''
  const names = event.value.participants.map(p => p.name)
  const me = displayName.value.trim()
  if (me && !names.includes(me))
    names.push(`${me}（未保存）`)
  return names.length ? `已填：${names.join('、')}` : '还没人填'
})

const selectedWho = computed(() => {
  if (!selectedKey.value || !event.value)
    return ''
  const names = whoFor(selectedKey.value)
  const [date, time] = selectedKey.value.split('T')
  const label = `${dayChip(date)} ${time}`
  if (!names.length)
    return `${label} · 还没人`
  return `${label} · ${names.length}人：${names.join('、')}`
})

function dayChip(iso: string) {
  const h = dayHeaderLabel(iso)
  return `${h.md} ${h.week}`
}

function whoFor(key: string): string[] {
  if (!event.value)
    return []
  const me = displayName.value.trim()
  const names: string[] = []
  for (const p of event.value.participants) {
    if (me && p.name === me)
      continue
    if (p.slots.includes(key))
      names.push(p.name)
  }
  if (me && mySlots.value.includes(key))
    names.push(me)
  return names
}

function cellCount(key: string): number {
  return whoFor(key).length
}

function cellStyle(key: string) {
  const n = cellCount(key)
  const max = heatmapMax.value
  const alpha = n === 0 ? 0 : 0.12 + 0.72 * (n / max)
  const mine = mySlots.value.includes(key)
  return {
    backgroundColor: n ? `rgba(13, 148, 136, ${alpha})` : '#f4f4f5',
    outline: mine ? '2px solid #0f766e' : 'none',
    outlineOffset: mine ? '-2px' : '0',
  }
}

function onCell(date: string, time: string) {
  const key = slotKey(date, time)
  selectedKey.value = key
  const me = displayName.value.trim()
  if (!me) {
    uni.showToast({ title: '先填显示名再勾格子', icon: 'none' })
    return
  }
  const i = mySlots.value.indexOf(key)
  if (i >= 0)
    mySlots.value.splice(i, 1)
  else
    mySlots.value.push(key)
  dirty.value = true
}

function applyMySlotsFromEvent() {
  const me = displayName.value.trim()
  if (!event.value || !me)
    return
  const found = event.value.participants.find(p => p.name === me)
  mySlots.value = found ? [...found.slots] : []
  dirty.value = false
}

function onNameInput(e: unknown) {
  displayName.value = inputValue(e)
}

function persistName() {
  const me = displayName.value.trim()
  if (me)
    uni.setStorageSync(NAME_KEY, me)
}

function onNameFocus(e: unknown) {
  const t = (e as { target?: { select?: () => void } }).target
  t?.select?.()
}

async function load() {
  if (!eventId.value) {
    error.value = '链接里没有活动 id'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    event.value = await getEvent(eventId.value)
    applyMySlotsFromEvent()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
    event.value = null
  }
  finally {
    loading.value = false
  }
}

async function onSave() {
  const me = displayName.value.trim()
  if (!me) {
    uni.showToast({ title: '请填写显示名', icon: 'none' })
    return
  }
  if (!eventId.value)
    return
  saving.value = true
  try {
    event.value = await saveParticipant(eventId.value, me, mySlots.value)
    dirty.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
  }
  catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  }
  finally {
    saving.value = false
  }
}

function onCopy() {
  if (!eventId.value)
    return
  uni.setClipboardData({
    data: buildShareUrl(eventId.value),
    success: () => uni.showToast({ title: '链接已复制', icon: 'success' }),
  })
}

function goHome() {
  uni.reLaunch({ url: '/pages/index' })
}

onLoad((query) => {
  eventId.value = String(query?.id || '')
  try {
    displayName.value = String(uni.getStorageSync(NAME_KEY) || '')
  }
  catch {
    displayName.value = ''
  }
  load()
})
</script>

<template>
  <div text-left>
    <div v-if="loading" py-10 text-center op-60>
      加载中…
    </div>
    <div v-else-if="error" py-10 text-center>
      <p>{{ error }}</p>
      <button mt-4 btn text-sm @click="goHome">
        去创建
      </button>
    </div>
    <template v-else-if="event">
      <h1 text-xl font-bold>
        {{ event.title }}
      </h1>
      <p mt-1 text-xs op-50>
        Asia/Shanghai · {{ event.dates.length }} 天 · {{ event.slotMinutes }} 分钟格
      </p>
      <p mt-1 text-xs op-70>
        {{ peopleLine }}
      </p>

      <div mt-3 flex gap-2>
        <button type="button" class="chip chip-on" @click="onCopy">
          复制链接
        </button>
        <button type="button" class="chip" @click="load">
          刷新
        </button>
      </div>
      <p v-if="shareUrl" class="share-url">
        {{ shareUrl }}
      </p>

      <label mt-4 block text-sm font-medium>你的显示名（不用登录）</label>
      <input
        class="field"
        :value="displayName"
        placeholder="例如：小王"
        maxlength="20"
        @input="onNameInput"
        @focus="onNameFocus"
        @blur="persistName"
      >

      <div class="slot-scroller" mt-3 overflow-x-auto>
        <div
          class="slot-grid"
          :style="{
            gridTemplateColumns: `48px repeat(${event.dates.length}, minmax(52px, 1fr))`,
            minWidth: `${48 + event.dates.length * 52}px`,
          }"
        >
          <div class="grid-corner" />
          <div
            v-for="d in event.dates"
            :key="`h-${d}`"
            class="grid-head"
          >
            <div>{{ dayHeaderLabel(d).week }}</div>
            <div text-xs op-70>
              {{ dayHeaderLabel(d).md }}
            </div>
          </div>

          <template v-for="t in times" :key="t">
            <div class="grid-time">
              {{ t }}
            </div>
            <button
              v-for="d in event.dates"
              :key="`${d}T${t}`"
              type="button"
              class="grid-cell"
              :style="cellStyle(slotKey(d, t))"
              @click="onCell(d, t)"
            >
              <span v-if="cellCount(slotKey(d, t))" class="grid-count">
                {{ cellCount(slotKey(d, t)) }}
              </span>
            </button>
          </template>
        </div>
      </div>

      <p mt-3 min-h-8 text-sm>
        {{ selectedWho || '点格子：勾选你能到的时间；再点一次可看到谁勾了。' }}
      </p>

      <button
        mt-2 btn w-full py-3 text-base
        :disabled="saving"
        @click="onSave"
      >
        {{ saving ? '保存中…' : (dirty ? '保存我的时间' : '保存') }}
      </button>
    </template>
  </div>
</template>
