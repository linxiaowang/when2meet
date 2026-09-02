<script setup lang="ts">
import { useCounterStore } from '~/stores/counter'

const props = defineProps<{ name: string }>()

definePage({
  style: {
    enableShareAppMessage: true,
  },
})

onShareAppMessage(() => ({
  title: props.name || '约',
  path: props.name ? `/pages/hi?name=${props.name}` : '/pages/hi',
  imageUrl: '/static/logo.png',
}))

const { time } = storeToRefs(useCounterStore())

const timeAge = useTimeAgo(time)
</script>

<template>
  <div>
    <div i-carbon-pedestrian inline-block text-4xl />
    <p my-1>
      Hi, {{ props.name }}!
    </p>
    <div text-sm italic op75>
      <em>Demo of dynamic route</em>
      <p mt-1>
        <em>{{ timeAge }} log</em>
      </p>
    </div>

    <div m="t-8 b-5">
      <TheCounter />
    </div>

    <div>
      <button m-3 btn text-sm @click="router.back()">
        Back
      </button>
    </div>
  </div>
</template>
