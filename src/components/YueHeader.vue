<script setup lang="ts">
import { useSafePad } from '~/composables/useSafePad'

const props = withDefaults(defineProps<{
  title?: string
  showBack?: boolean
}>(), {
  title: '约',
  showBack: false,
})

const emit = defineEmits<{
  back: []
}>()

const { navTop, navHeight, padTop, padRight, read } = useSafePad()

onReady(() => {
  read()
})

function onBack() {
  emit('back')
  uni.navigateBack({
    fail: () => uni.reLaunch({ url: '/pages/index' }),
  })
}
</script>

<template>
  <view
    class="yue-header"
    :style="{
      height: `${padTop}px`,
      paddingTop: `${navTop}px`,
      boxSizing: 'border-box',
    }"
  >
    <view
      class="bar"
      :style="{
        height: `${navHeight}px`,
        paddingLeft: '8px',
        paddingRight: `${padRight}px`,
      }"
    >
      <view
        v-if="showBack"
        class="back"
        hover-class="back-hover"
        @click="onBack"
      >
        <view class="chevron" />
      </view>
      <text class="title">{{ props.title }}</text>
    </view>
  </view>
</template>

<style scoped>
.yue-header {
  flex-shrink: 0;
  width: 100%;
  overflow: hidden;
}
.bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
}
.back {
  width: 40px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.back-hover {
  opacity: 0.55;
}
.chevron {
  width: 10px;
  height: 10px;
  margin-left: 4px;
  border-left: 2px solid #111827;
  border-bottom: 2px solid #111827;
  transform: rotate(45deg);
}
.dark .chevron {
  border-color: #f9fafb;
}
.title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  color: #111827;
}
.dark .title {
  color: #f9fafb;
}
</style>
